import { is } from '@yarnaimo/rain'
import * as bigInt from 'big-integer'
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

export const getUrlOfTweet = (t: Status) => {
    const {
        id_str,
        user: { screen_name },
    } = originalTweet(t)
    return `https://twitter.com/${screen_name}/status/${id_str}`
}

export const extractTweetIdFromUrl = (url: string) => {
    const m = url.match(/(?:twitter.com\/\w+\/status\/)?(\d+)$/)
    return m ? m[1] : null
}

export const getOrigUrlFromTwimgUrl = (url: string) => {
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

export const extractVideoUrlFromTweet = ({ extended_entities }: Status) => {
    const types = new Map([['video', 'video'], ['animated_gif', 'gif']])

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
