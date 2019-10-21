import { Rarray } from '@yarnaimo/rain'
import { createHmac } from 'crypto'
import got from 'got'
import * as OAuth from 'oauth-1.0a'
import { Status } from 'twitter-d'
import { JsonObject, JsonValue } from 'type-fest'

type JsonObjectU = { [key: string]: JsonValue | undefined }

export const baseUrl = 'https://api.twitter.com/1.1'
export const pathToUrl = (path: string) => `${baseUrl}/${path}.json`

const buildRequestData = (data: JsonObjectU) => {
    const filtered = Object.entries(data).reduce(
        (a, [key, value]) => {
            return value != null ? { ...a, [key]: value } : a
        },
        {} as JsonObject,
    )

    return { ...filtered, tweet_mode: 'extended' }
}

type OAuthOptions = {
    consumerKey: string
    consumerSecret: string
    token: string
    tokenSecret: string
}

export const TwimoClient = (options: OAuthOptions) => {
    const oauth = new OAuth({
        consumer: {
            key: options.consumerKey,
            secret: options.consumerSecret,
        },
        signature_method: 'HMAC-SHA1',
        realm: '',
        hash_function: (baseString, key) =>
            createHmac('sha1', key)
                .update(baseString)
                .digest('base64'),
    })

    const token = { key: options.token, secret: options.tokenSecret }

    const buildHeader = (url: string, method: string, data: any) => {
        const { Authorization } = oauth.toHeader(
            oauth.authorize({ url, method, data }, token),
        )
        return { Authorization }
    }

    const defaultParams = {
        trim_user: false,
        exclude_replies: false,
        include_entities: true,
    }

    const get = async <T extends object>(
        path: string,
        params: JsonObjectU = {},
    ) => {
        const url = pathToUrl(path)
        const reqData = buildRequestData(params)

        const headers = buildHeader(url, 'GET', reqData)
        return got
            .get(url, {
                headers,
                searchParams: reqData,
            })
            .json<T>()
    }

    const post = async <T extends object>(
        path: string,
        data: JsonObjectU = {},
    ) => {
        const url = pathToUrl(path)
        const reqData = buildRequestData(data)

        const headers = buildHeader(url, 'POST', reqData)
        return got
            .post(url, {
                headers,
                form: reqData,
            })
            .json<T>()
    }

    const createTweet = async (text: string, data: JsonObjectU = {}) => {
        return post<Status>('statuses/update', { ...data, status: text })
    }

    const postThread = async (texts: string[]) => {
        const postedTweets = [] as Status[]

        for (const text of texts) {
            const lastTweet = postedTweets[postedTweets.length - 1]

            const tweet = await post<Status>('statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
                status: text,
            })
            postedTweets.push(tweet)
        }

        return postedTweets
    }

    const retweet = async (ids: string[]) => {
        const tweets = await Rarray(ids).onlyResolved(async id =>
            post<Status>('statuses/retweet', { id }),
        )
        return tweets
    }

    const searchTweets = async ({
        q,
        count = 100,
        maxId,
        sinceId,
    }: {
        q: string
        count?: number
        maxId?: string
        sinceId?: string
    }) => {
        const { statuses } = await get<{ statuses: Status[] }>(
            'search/tweets',
            {
                q,
                count,
                result_type: 'recent',
                max_id: maxId,
                since_id: sinceId,
            },
        )
        return statuses
    }

    return {
        defaultParams,
        get,
        post,
        createTweet,
        postThread,
        retweet,
        searchTweets,
    }
}
