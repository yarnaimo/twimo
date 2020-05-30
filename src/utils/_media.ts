import { MediaEntity } from 'twitter-d'
import { VideoInfo } from 'twitter-d/types/video_info'
import { VideoVariant } from 'twitter-d/types/video_variant'
import { ImageSizeLabel, TwimoFragment } from '../types'
import { calcAspectRatio } from './_calc'

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

export const thumb = (entity: MediaEntity): TwimoFragment.Image => ({
    url: getImageUrlWithSizeLabel('small', entity.media_url_https),
    aspectRatio: calcAspectRatio(entity.sizes.small),
})

export const orig = (entity: MediaEntity): TwimoFragment.Image => ({
    url: getImageUrlWithSizeLabel('orig', entity.media_url_https),
    aspectRatio: calcAspectRatio(entity.sizes.large),
})

export const video = (
    {
        aspect_ratio: aspectRatio = null,
        duration_millis: durationMs = null,
    }: VideoInfo,
    largestVariant: VideoVariant,
): TwimoFragment.Video => ({
    url: largestVariant.url,
    aspectRatio,
    durationMs,
})

export const largestVariant = (
    variants: VideoVariant[],
): VideoVariant | undefined => {
    return variants.sort((a, b) => {
        return (b.bitrate || 0) - (a.bitrate || 0)
    })[0]
}
