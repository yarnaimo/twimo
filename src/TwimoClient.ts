import bigInt from 'big-integer';
import crypto from 'crypto';
import got from 'got';
import OAuth, { Token } from 'oauth-1.0a';
import { ITweet } from './Tweet';

const baseUrl = 'https://api.twitter.com/1.1'

export const plusOne = (numString: string) =>
    bigInt(numString)
        .plus(1)
        .toString()

export const minusOne = (numString: string) =>
    bigInt(numString)
        .minus(1)
        .toString()

type ParamObject = { [key: string]: any }

const toRequestData = (source: ParamObject) => {
    const target = {} as ParamObject
    for (const key in source) {
        if (source[key] != null) target[key] = source[key]
    }
    target.tweet_mode = 'extended'
    return target
}

interface OAuthOptions {
    consumerKey: string
    consumerSecret: string
    token: string
    tokenSecret: string
}

export class TwimoClient {
    public oauth: OAuth
    public token: Token

    constructor(options: OAuthOptions) {
        this.oauth = new OAuth({
            consumer: {
                key: options.consumerKey,
                secret: options.consumerSecret,
            },
            signature_method: 'HMAC-SHA1',
            realm: '',
            hash_function: (baseString, key) =>
                crypto
                    .createHmac('sha1', key)
                    .update(baseString)
                    .digest('base64'),
        })

        this.token = { key: options.token, secret: options.tokenSecret }
    }

    toHeader(url: string, method: string, data: any) {
        const { Authorization } = this.oauth.toHeader(
            this.oauth.authorize({ url, method, data }, this.token)
        )
        return { Authorization }
    }

    async get<T>(path: string, params: ParamObject = {}) {
        const url = `${baseUrl}/${path}.json`
        const reqData = toRequestData(params)

        const headers = this.toHeader(url, 'GET', reqData)
        const { body } = await got.get(url, {
            headers,
            json: true,
            query: reqData,
        })
        return body as T
    }

    async post<T>(path: string, data: ParamObject = {}) {
        const url = `${baseUrl}/${path}.json`
        const reqData = toRequestData(data)

        const headers = this.toHeader(url, 'POST', reqData)
        const { body } = await got.post(url, {
            headers,
            json: true,
            form: true,
            body: reqData,
        })
        return body as T
    }

    async postThread(texts: string[]) {
        return await texts.reduce(async (prevPromise, text) => {
            const prevTweets = await prevPromise
            const lastTweet = prevTweets[prevTweets.length - 1]

            const t = await this.post<ITweet>('statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
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
