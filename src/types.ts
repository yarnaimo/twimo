import { FullUser, Status } from 'twitter-d'
import { JsonValue, Merge } from 'type-fest'

export type FullStatus = Merge<Status, { user: FullUser }>

export type JsonObjectU = { [key: string]: JsonValue | undefined }

export namespace TwimoOptions {
    export type Consumer = {
        consumerKey: string
        consumerSecret: string
    }
    export type Token = {
        token: string
        tokenSecret: string
    }
}

export type ImageSizeLabel = 'thumb' | 'small' | 'medium' | 'large' | 'orig'

export namespace TwimoFragment {
    export type AspectRatio = readonly [number, number]

    export type Image = {
        url: string
        aspectRatio: AspectRatio
    }
    export type Video = {
        url: string
        aspectRatio: AspectRatio | null
        durationMs: number | null
    }
}

export namespace TwimoMediaEntity {
    export type Image = {
        type: 'image'
        thumb: TwimoFragment.Image
        image: TwimoFragment.Image
    }
    export type Video = {
        type: 'video'
        thumb: TwimoFragment.Image
        video: TwimoFragment.Video
    }
    export type Gif = {
        type: 'gif'
        thumb: TwimoFragment.Image
        video: TwimoFragment.Video
    }
}

export type TwimoMediaSet = {
    images: TwimoMediaEntity.Image[]
    video: TwimoMediaEntity.Video | TwimoMediaEntity.Gif | null
}
