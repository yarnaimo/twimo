import axios from 'axios'
import bigInt from 'big-integer'
import lazy from 'lazy.js'
import {
    getOAuthAuthorizationHeader,
    OAuthOptions,
} from 'oauth-authorization-header'
import { URLSearchParams } from 'url'
import { ITweet } from './Tweet'

const baseUrl = 'https://api.twitter.com/1.1'

export const plusOne = (numString: string) =>
    bigInt(numString)
        .plus(1)
        .toString()

export const minusOne = (numString: string) =>
    bigInt(numString)
        .minus(1)
        .toString()

export class Twitter {
    constructor(public oAuth: OAuthOptions) {
        this.oAuth = oAuth
    }

    private buildRequestConfig(
        method: 'GET' | 'POST',
        path: string,
        params: { [key: string]: string }
    ) {
        const isGET = method === 'GET'
        const url = `${baseUrl}/${path}.json`

        params.tweet_mode = 'extended'
        const compacted = lazy(params)
            .pairs()
            .filter(([k, v]: any) => v != null)
            .toObject() as { [key: string]: string }

        const authHeader = getOAuthAuthorizationHeader({
            oAuth: this.oAuth,
            url,
            method,
            [isGET ? 'queryParams' : 'formParams']: compacted,
        } as any)

        return {
            url,
            searchParams: new URLSearchParams(compacted),
            headers: { Authorization: authHeader },
        }
    }

    async get<T>(path: string, params: { [key: string]: any } = {}) {
        const { url, searchParams, headers } = this.buildRequestConfig(
            'GET',
            path,
            params
        )
        const { data } = await axios.get(url, { headers, params: searchParams })
        return data as T
    }

    async post<T>(path: string, form: { [key: string]: any } = {}) {
        const { url, searchParams, headers } = this.buildRequestConfig(
            'POST',
            path,
            form
        )
        const { data } = await axios.post(url, searchParams, { headers })
        return data as T
    }

    async postThread(texts: string[]) {
        return await texts.reduce(async (prevPromise, text) => {
            const prevTweets = await prevPromise

            const t = await this.post<ITweet>('statuses/update', {
                in_reply_to_status_id: prevTweets[prevTweets.length - 1].id_str,
                status: text,
            })
            return [...prevTweets, t]
        }, Promise.resolve([] as ITweet[]))
    }

    async retweet(ids: string[]) {
        const tasks = ids.map(async id => {
            const t = await this.post<ITweet>('statuses/retweet', {
                id,
            }).catch(() => null)
            return t
        })
        const results = await Promise.all(tasks)
        return results.filter(t => t !== null) as ITweet[]
    }

    async searchTweets({
        q,
        count = 100,
        maxId,
        sinceId,
    }: {
        q: string
        count?: number
        maxId?: string
        sinceId?: string
    }) {
        const { statuses } = await this.get<{ statuses: ITweet[] }>(
            'search/tweets',
            {
                q,
                count,
                result_type: 'recent',
                max_id: maxId,
                since_id: sinceId,
            }
        )
        return statuses as ITweet[]
    }
}
