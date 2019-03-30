export { TwimoClient } from './TwimoClient'
import bigInt from 'big-integer'
import { Status } from 'twitter-d'

export const plusOne = (numString: string) =>
    bigInt(numString)
        .plus(1)
        .toString()

export const minusOne = (numString: string) =>
    bigInt(numString)
        .minus(1)
        .toString()

export const originalTweet = (t: Status) => t.retweeted_status || t

export const tweetToUrl = (t: Status) => {
    const {
        id_str,
        user: { screen_name },
    } = originalTweet(t)
    return `https://twitter.com/${screen_name}/status/${id_str}`
}

export const urlToTweetId = (url: string) => {
    const m = url.match(/(?:twitter.com\/\w+\/status\/)?(\d+)$/)
    return m ? m[1] : null
}

export const twimgUrlToOrig = (url: string) => {
    const m1 = url.match(/^https:\/\/pbs.twimg.com\/media\/[\w-]+\.[a-z]+/m)
    if (m1) {
        return m1[0] + ':orig'
    }

    const m2 = url.match(/^https:\/\/pbs.twimg.com\/media\/[\w-]+\?format=\w+/m)
    if (m2) {
        return m2[0] + '&name=orig'
    }

    return url
}
