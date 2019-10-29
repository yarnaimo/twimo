import is from '@sindresorhus/is'
import bigInt from 'big-integer'
import { ExtendedEntities, FullUser, MediaEntity, Status } from 'twitter-d'

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
    } = originalTweet(t) as Status & { user: FullUser }
    return `https://twitter.com/${screen_name}/status/${id_str}`
}

export const extractTweetIdFromUrl = (url: string) => {
    const m = url.match(/(?:twitter.com\/\w+\/status\/)?(\d+)$/)
    return m ? m[1] : null
}

type ImageSizeLabel = 'thumb' | 'small' | 'medium' | 'large' | 'orig'

type _TwimoMediaType<T> = {
    type: T
    url: string
    thumbUrl: string
}

export type TwimoMediaTypes = {
    image: _TwimoMediaType<'image'>
    video: _TwimoMediaType<'video'>
    gif: _TwimoMediaType<'gif'>
}

export const getImageUrlWithSizeLabel = (size: ImageSizeLabel, url: string) => {
    const m1 = url.match(/^https:\/\/pbs.twimg.com\/media\/[\w-]+\.[a-z]+/m)
    if (m1) {
        return m1[0] + `:${size}`
    }

    const mv = url.match(
        /^https:\/\/pbs.twimg.com\/ext_tw_video_thumb\/\d+\/pu\/img\/[\w-]+\.[a-z]+/m,
    )
    if (mv) {
        return mv[0] + `:${size}`
    }

    const m2 = url.match(
        /^(https:\/\/pbs.twimg.com\/media\/[\w-]+\?).*(format=\w+)/m,
    )
    if (m2) {
        return m2[1] + m2[2] + `&name=${size}`
    }

    return url
}

const getMediaList = (
    extended_entities: ExtendedEntities | null | undefined,
) => {
    return extended_entities && extended_entities.media
}

export const extractImageEntitiesFromMediaEntities = (
    mediaEntities: MediaEntity[],
) => {
    const images = mediaEntities.filter(entity => entity.type === 'photo')
    if (!images.length) {
        return
    }

    return images.map<TwimoMediaTypes['image']>(image => ({
        type: 'image' as const,
        url: getImageUrlWithSizeLabel('orig', image.media_url_https),
        thumbUrl: getImageUrlWithSizeLabel('small', image.media_url_https),
    }))
}

export const extractVideoEntityFromMediaEntities = (
    mediaEntities: MediaEntity[],
): TwimoMediaTypes['video' | 'gif'] | undefined => {
    const types = new Map([
        ['video', 'video' as const],
        ['animated_gif', 'gif' as const],
    ])

    if (
        !mediaEntities[0] ||
        !mediaEntities[0].video_info ||
        !mediaEntities[0].video_info.variants
    ) {
        return
    }

    const {
        type,
        video_info: { variants },
        media_url_https,
    } = mediaEntities[0]

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
        thumbUrl: getImageUrlWithSizeLabel('small', media_url_https),
    }
}

export const extractMediaListFromTweet = ({
    extended_entities,
}: Status): TwimoMediaTypes[keyof TwimoMediaTypes][] | undefined => {
    const mediaEntities = getMediaList(extended_entities)
    if (!mediaEntities) {
        return
    }

    const imageEntities = extractImageEntitiesFromMediaEntities(mediaEntities)
    if (imageEntities) {
        return imageEntities
    }

    const videoEntity = extractVideoEntityFromMediaEntities(mediaEntities)
    if (videoEntity) {
        return [videoEntity]
    }

    return
}
