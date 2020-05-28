import { createHmac } from 'crypto'
import OAuth from 'oauth-1.0a'
import { TwitterAPIKeyOptions, TwitterTokenOptions } from './types'

export const baseUrl = 'https://api.twitter.com/1.1'
export const pathToUrl = (path: string) => `${baseUrl}/${path}.json`

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
            createHmac('sha1', key).update(baseString).digest('base64'),
    })

    const tokenPair = { key: token, secret: tokenSecret }

    const buildHeader = (url: string, method: string, data: any) => {
        const { Authorization } = oauth.toHeader(
            oauth.authorize({ url, method, data }, tokenPair),
        )
        return { Authorization }
    }

    return { token, tokenSecret, buildHeader }
}

export type TwimoBuilder = ReturnType<typeof Twimo>
export type Twimo = ReturnType<TwimoBuilder>
