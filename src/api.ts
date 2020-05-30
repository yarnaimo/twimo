import { FilterNonNull, MapAsync, P, PP } from 'lifts'
import pReduce from 'p-reduce'
import * as R from 'remeda'
import { twget, twpost } from './api-core'
import { Twimo } from './Twimo'
import { FullStatus, JsonObjectU } from './types'

/**
 * GET statuses/lookup
 */
export const lookupTweets = (twimo: Twimo, ids: string[]) => {
    return twget<FullStatus[]>(twimo, 'statuses/lookup', {
        id: ids.join(),
    })
}

/**
 * GET search/tweets
 */
export const searchTweets = async (
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
    type Response = {
        statuses: FullStatus[]
    }

    return P(
        await twget<Response>(twimo, 'search/tweets', {
            q,
            count,
            result_type: 'recent',
            max_id: maxId,
            since_id: sinceId,
        }),
        R.prop('statuses'),
    )
}

/**
 * GET mutes/users/ids
 */
export const getMutedIds = async (twimo: Twimo) => {
    type Response = {
        ids: string[]
    }

    return P(
        await twget<Response>(twimo, 'mutes/users/ids', {
            stringify_ids: true,
        }),
        R.prop('ids'),
    )
}

/**
 * POST statuses/update
 */
export const createTweet = (
    twimo: Twimo,
    text: string,
    data: JsonObjectU = {},
) => {
    return twpost<FullStatus>(twimo, 'statuses/update', {
        ...data,
        status: text,
    })
}

/**
 * POST statuses/update (スレッド)
 */
export const postThread = async (twimo: Twimo, texts: string[]) => {
    return pReduce(
        texts,
        async (prev, text) => {
            const lastTweet = prev[prev.length - 1] as
                | typeof prev[number]
                | undefined

            const result = await twpost<FullStatus>(twimo, 'statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
                status: text,
            })
            return [...prev, result]
        },
        [] as FullStatus[],
    )
}

/**
 * POST statuses/retweet
 */
export const retweet = async (twimo: Twimo, ids: string[]) => {
    return PP(
        ids,
        MapAsync(async (id) => {
            return twpost<FullStatus>(twimo, 'statuses/retweet', { id }).catch(
                () => null,
            )
        }),
        FilterNonNull,
    )
}
