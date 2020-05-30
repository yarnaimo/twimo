import bigInt from 'big-integer'
import { FullUser, Status } from 'twitter-d'

/**
 * `id_str` などの `string` 型の数字に1を足します。
 */
export const plusOne = (numString: string) =>
    bigInt(numString).plus(1).toString()

/**
 * `id_str` などの `string` 型の数字から1を引きます。
 */
export const minusOne = (numString: string) =>
    bigInt(numString).minus(1).toString()

/**
 * `retweeted_status` がある場合はそれを返し、ない場合はツイートをそのまま返します。
 */
export const originalTweet = (t: Status) => t.retweeted_status ?? t

/**
 * ツイートのURLを取得します。
 */
export const getUrlOfTweet = (t: Status) => {
    const {
        id_str,
        user: { screen_name },
    } = originalTweet(t) as Status & { user: FullUser }
    return `https://twitter.com/${screen_name}/status/${id_str}`
}

/**
 * ツイートのURLからツイートのIDを取得します。
 */
export const getTweetIdFromUrl = (url: string) => {
    const m = url.match(/(?:twitter.com\/\w+\/status\/)?(\d+)$/)
    return m ? m[1] : null
}
