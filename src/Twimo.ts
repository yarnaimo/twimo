import { $ } from '@yarnaimo/rain'
import { createHmac } from 'crypto'
import got from 'got'
import OAuth from 'oauth-1.0a'
import { JsonObject, JsonValue } from 'type-fest'
import { FullStatus } from './types'

type JsonObjectU = { [key: string]: JsonValue | undefined }

export const baseUrl = 'https://api.twitter.com/1.1'
export const pathToUrl = (path: string) => `${baseUrl}/${path}.json`

const buildRequestData = (data: JsonObjectU) => {
    const filtered = Object.entries(data).reduce((a, [key, value]) => {
        return value != null ? { ...a, [key]: value } : a
    }, {} as JsonObject)

    return { ...filtered, tweet_mode: 'extended' }
}

export type TwitterAPIKeyOptions = {
    consumerKey: string
    consumerSecret: string
}
export type TwitterTokenOptions = {
    token: string
    tokenSecret: string
}

export const Twimo = ({
    consumerKey,
    consumerSecret,
}: TwitterAPIKeyOptions) => ({ token, tokenSecret }: TwitterTokenOptions) => {
    const oauth = new OAuth({
        consumer: {
            key: consumerKey,
            secret: consumerSecret,
        },
        signature_method: 'HMAC-SHA1',
        realm: '',
        hash_function: (baseString, key) =>
            createHmac('sha1', key)
                .update(baseString)
                .digest('base64'),
    })

    const tokenPair = { key: token, secret: tokenSecret }

    const buildHeader = (url: string, method: string, data: any) => {
        const { Authorization } = oauth.toHeader(
            oauth.authorize({ url, method, data }, tokenPair),
        )
        return { Authorization }
    }

    return { buildHeader }
}

export type TwimoBuilder = ReturnType<typeof Twimo>
export type Twimo = ReturnType<TwimoBuilder>

const defaultParams = {
    trim_user: false,
    exclude_replies: false,
    // include_entities: true,
}

const get = <T extends object>(
    path: string,
    params: JsonObjectU = {},
) => async (twimo: Twimo) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(params)

    const headers = twimo.buildHeader(url, 'GET', reqData)
    return got
        .get(url, {
            headers,
            searchParams: reqData,
        })
        .json<T>()
}

const post = <T extends object>(path: string, data: JsonObjectU = {}) => async (
    twimo: Twimo,
) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(data)

    const headers = twimo.buildHeader(url, 'POST', reqData)
    return got
        .post(url, {
            headers,
            form: reqData,
        })
        .json<T>()
}

// get

const lookupTweets = (ids: string[]) =>
    get<FullStatus[]>('statuses/lookup', {
        ...defaultParams,
        id: ids.join(),
    })

const searchTweets = ({
    q,
    count = 100,
    maxId,
    sinceId,
}: {
    q: string
    count?: number
    maxId?: string
    sinceId?: string
}) => async (twimo: Twimo) => {
    const { statuses } = await $.p(
        twimo,
        get<{ statuses: FullStatus[] }>('search/tweets', {
            q,
            count,
            result_type: 'recent',
            max_id: maxId,
            since_id: sinceId,
        }),
    )

    return statuses
}

export const getMutedIds = () => async (twimo: Twimo) => {
    const { ids } = await $.p(
        twimo,
        get<{
            ids: string[]
        }>('mutes/users/ids', { stringify_ids: true }),
    )
    return new Set(ids)
}

// post

const createTweet = (text: string, data: JsonObjectU = {}) =>
    post<FullStatus>('statuses/update', { ...data, status: text })

const postThread = (texts: string[]) => async (twimo: Twimo) => {
    const postedTweets = [] as FullStatus[]

    for (const text of texts) {
        const lastTweet = postedTweets[postedTweets.length - 1]

        const tweet = await $.p(
            twimo,
            post<FullStatus>('statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
                status: text,
            }),
        )

        postedTweets.push(tweet)
    }

    return postedTweets
}

const retweet = (ids: string[]) => async (twimo: Twimo) => {
    return $.mapResolved(ids, id =>
        post<FullStatus>('statuses/retweet', { id })(twimo),
    )
}

export const T = {
    defaultParams,

    get,
    post,

    lookupTweets,
    searchTweets,
    getMutedIds,

    createTweet,
    postThread,
    retweet,
}
