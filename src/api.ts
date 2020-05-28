import got from 'got'
import { FilterNonNull, MapAsync, PP } from 'lifts'
import pReduce from 'p-reduce'
import * as R from 'remeda'
import { pathToUrl, Twimo } from './Twimo'
import { FullStatus, JsonObjectU } from './types'
import { buildRequestData } from './_utils'

const defaultParams = {
    trim_user: false,
    exclude_replies: false,
    // include_entities: true,
}

const get = <T extends object>(
    twimo: Twimo,
    path: string,
    params: JsonObjectU = {},
) => {
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

const post = <T extends object>(
    twimo: Twimo,
    path: string,
    data: JsonObjectU = {},
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

const lookupTweets = (twimo: Twimo, ids: string[]) =>
    get<FullStatus[]>(twimo, 'statuses/lookup', {
        ...defaultParams,
        id: ids.join(),
    })

const searchTweets = async (
    twimo: Twimo,
    {
        q,
        count = 100,
        maxId,
        sinceId,
    }: {
        q: string
        count?: number
        maxId?: string
        sinceId?: string
    },
) => {
    const { statuses } = await get<{ statuses: FullStatus[] }>(
        twimo,
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

export const getMutedIds = async (twimo: Twimo) => {
    return PP(
        await get<{
            ids: string[]
        }>(twimo, 'mutes/users/ids', { stringify_ids: true }),

        R.prop('ids'),
    )
}

// post

const createTweet = (twimo: Twimo, text: string, data: JsonObjectU = {}) =>
    post<FullStatus>(twimo, 'statuses/update', { ...data, status: text })

const postThread = async (twimo: Twimo, texts: string[]) => {
    return pReduce(
        texts,
        async (prev, text) => {
            const lastTweet = prev[prev.length - 1] as
                | typeof prev[number]
                | undefined

            const result = await post<FullStatus>(twimo, 'statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
                status: text,
            })
            return [...prev, result]
        },
        [] as FullStatus[],
    )
}

const retweet = async (twimo: Twimo, ids: string[]) => {
    return PP(
        ids,
        MapAsync(async (id) => {
            return post<FullStatus>(twimo, 'statuses/retweet', { id }).catch(
                () => null,
            )
        }),
        FilterNonNull,
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
