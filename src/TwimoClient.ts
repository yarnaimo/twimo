import { is, PlainObject } from '@yarnaimo/rain'
import crypto from 'crypto'
import got from 'got'
import OAuth, { Token } from 'oauth-1.0a'
import { Status } from 'twitter-d'

export const baseUrl = 'https://api.twitter.com/1.1'
export const pathToUrl = (path: string) => `${baseUrl}/${path}.json`

const toRequestData = (source: PlainObject) => {
    const target = {} as PlainObject
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

    private toHeader(url: string, method: string, data: any) {
        const { Authorization } = this.oauth.toHeader(
            this.oauth.authorize({ url, method, data }, this.token),
        )
        return { Authorization }
    }

    async get<T>(path: string, params: PlainObject = {}) {
        const url = pathToUrl(path)
        const reqData = toRequestData(params)

        const headers = this.toHeader(url, 'GET', reqData)
        const { body } = await got.get(url, {
            headers,
            json: true,
            query: reqData,
        })
        return body as T
    }

    async post<T>(path: string, data: PlainObject = {}) {
        const url = pathToUrl(path)
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

    async createTweet(text: string, data: PlainObject = {}) {
        return this.post<Status>('statuses/update', { ...data, status: text })
    }

    async postThread(texts: string[]) {
        return await texts.reduce(async (prevPromise, text) => {
            const prevTweets = await prevPromise
            const lastTweet = prevTweets[prevTweets.length - 1]

            const t = await this.post<Status>('statuses/update', {
                in_reply_to_status_id: lastTweet ? lastTweet.id_str : null,
                status: text,
            })
            return [...prevTweets, t]
        }, Promise.resolve([] as Status[]))
    }

    async retweet(ids: string[]) {
        const tasks = ids.map(async id => {
            const t = await this.post<Status>('statuses/retweet', {
                id,
            }).catch(() => null)
            return t
        })
        const results = await Promise.all(tasks)
        return results.filter(t => t !== null) as Status[]
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
        const { statuses } = await this.get<{ statuses: Status[] }>('search/tweets', {
            q,
            count,
            result_type: 'recent',
            max_id: maxId,
            since_id: sinceId,
        })
        return statuses
    }

    async getVideoURLInTweet(id: string) {
        const types = new Map([['video', 'video'], ['animated_gif', 'gif']])

        const { extended_entities } = await this.get<Status>('statuses/show', { id })

        if (
            !extended_entities ||
            !extended_entities.media ||
            !extended_entities.media[0] ||
            !extended_entities.media[0].video_info ||
            !extended_entities.media[0].video_info.variants
        ) {
            return
        }

        const {
            type,
            video_info: { variants },
        } = extended_entities.media[0]

        const largest = variants.sort((a, b) => {
            return (b.bitrate || 0) - (a.bitrate || 0)
        })[0]

        const mediaType = types.get(type)

        if (!mediaType || !is.string(largest.url)) {
            return
        }

        return {
            type: mediaType,
            url: largest.url,
        }
    }
}
