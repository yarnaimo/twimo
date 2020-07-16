import Base64 from 'crypto-js/enc-base64'
import HmacSHA1 from 'crypto-js/hmac-sha1'
import OAuth from 'oauth-1.0a'
import { TwimoOptions } from './types'

export const baseUrl = 'https://api.twitter.com/1.1'
export const pathToUrl = (path: string) => `${baseUrl}/${path}.json`

/**
 * Twimoを初期化します。(consumer key/secret の設定と token の設定にカリー化されています)
 */
export const Twimo = ({
    consumerKey,
    consumerSecret,
}: TwimoOptions.Consumer) => ({ token, tokenSecret }: TwimoOptions.Token) => {
    const oauth = new OAuth({
        consumer: {
            key: consumerKey,
            secret: consumerSecret,
        },
        signature_method: 'HMAC-SHA1',
        realm: '',
        hash_function: (baseString, key) =>
            Base64.stringify(HmacSHA1(baseString, key)),
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
