import { is } from '@yarnaimo/rain'
import * as bigInt from 'big-integer'
import { ExtendedEntities, Status } from 'twitter-d'

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

const getMediaList = (
    extended_entities: ExtendedEntities | null | undefined,
) => {
    return extended_entities && extended_entities.media
}

export const extractImageUrlsFromTweet = ({ extended_entities }: Status) => {
    const mediaList = getMediaList(extended_entities)
    if (!mediaList) {
        return
    }

    const images = mediaList.filter(media => media.type === 'photo')
    if (!images.length) {
        return
    }

    return images.map(image => getOrigUrlFromTwimgUrl(image.media_url_https))
}

export const extractVideoUrlFromTweet = ({ extended_entities }: Status) => {
    const types = new Map([['video', 'video'], ['animated_gif', 'gif']])

    const mediaList = getMediaList(extended_entities)

    if (
        !mediaList ||
        !mediaList[0] ||
        !mediaList[0].video_info ||
        !mediaList[0].video_info.variants
    ) {
        return
    }

    const {
        type,
        video_info: { variants },
    } = mediaList[0]

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
