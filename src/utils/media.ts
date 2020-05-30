import { P, Switch } from 'lifts'
import * as R from 'remeda'
import { MediaEntity, Status } from 'twitter-d'
import { TwimoMediaEntity, TwimoMediaSet } from '../types'
import { largestVariant, orig, thumb, video } from './_media'

export const getImageEntities = (mediaEntities: MediaEntity[]) => {
    return P(
        mediaEntities,
        R.filter(({ type }) => type === 'photo'),
        R.map(
            (image): TwimoMediaEntity.Image => ({
                type: 'image',
                thumb: thumb(image),
                image: orig(image),
            }),
        ),
    )
}

export const getVideoEntity = ([entity]: MediaEntity[]):
    | TwimoMediaEntity.Video
    | TwimoMediaEntity.Gif
    | null => {
    if (!entity?.video_info?.variants) {
        return null
    }

    const {
        type: origType,
        video_info: { variants },
    } = entity

    const type = Switch(origType)(
        {
            video: () => 'video' as const,
            animated_gif: () => 'gif' as const,
        },
        () => null,
    )
    const largest = largestVariant(variants)

    if (!type || !largest) {
        return null
    }

    return {
        type,
        thumb: thumb(entity),
        video: video(entity.video_info, largest),
    }
}

/**
 * ツイートに含まれるメディアの一覧を取得します。
 */
export const getMediaList = ({ extended_entities }: Status): TwimoMediaSet => {
    const mediaEntities = extended_entities?.media

    const images = getImageEntities(mediaEntities ?? [])
    const video = getVideoEntity(mediaEntities ?? [])

    return { images, video }
}
