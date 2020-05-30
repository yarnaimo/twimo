import { getMediaList } from '../utils/media'
import { getImageUrlWithSizeLabel } from '../utils/_media'

const mediaUrl = 'https://pbs.twimg.com/media/a-Bc'

test('getImageUrlWithSizeLabel', () => {
    expect(getImageUrlWithSizeLabel('orig', mediaUrl + '.jpg?xxx')).toBe(
        mediaUrl + '.jpg:orig',
    )
    expect(
        getImageUrlWithSizeLabel('small', mediaUrl + '?a=b&format=png&c=d'),
    ).toBe(mediaUrl + '?format=png&name=small')
})

const sizes = {
    large: { w: 1280, h: 720 },
    small: { w: 800, h: 600 },
}

test('getMediaList - image', () => {
    const entities = [
        {
            type: 'photo',
            media_url_https: mediaUrl + '1.jpg?xxx',
            sizes,
        },
        {
            type: 'photo',
            media_url_https: mediaUrl + '2.jpg?xxx',
            sizes,
        },
        {
            type: 'video',
            media_url_https: mediaUrl + '3.mp4?xxx',
        },
    ]

    const result = getMediaList({
        extended_entities: { media: entities },
    } as any)

    const expected = {
        images: [
            {
                type: 'image',
                thumb: {
                    url: mediaUrl + '1.jpg:small',
                    aspectRatio: [4, 3],
                },
                image: {
                    url: mediaUrl + '1.jpg:orig',
                    aspectRatio: [16, 9],
                },
            },
            {
                type: 'image',
                thumb: {
                    url: mediaUrl + '2.jpg:small',
                    aspectRatio: [4, 3],
                },
                image: {
                    url: mediaUrl + '2.jpg:orig',
                    aspectRatio: [16, 9],
                },
            },
        ],
        video: null,
    }

    expect(result).toEqual(expected)
})

test('getMediaList - video', () => {
    const video_info = {
        aspect_ratio: [16, 9],
        duration_millis: 5000,
        variants: [
            { bitrate: 200, url: mediaUrl + '2.mp4' },
            { bitrate: 300, url: mediaUrl + '3.mp4' },
            { url: mediaUrl + '.mp4' },
            { bitrate: 100, url: mediaUrl + '1.mp4' },
        ],
    }
    const thumbUrl =
        'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a-Bc.jpg'

    const result = getMediaList({
        extended_entities: {
            media: [
                {
                    type: 'video',
                    video_info,
                    media_url_https: `${thumbUrl}?xxx`,
                    sizes,
                },
            ],
        },
    } as any)

    const expected = {
        images: [],
        video: {
            type: 'video',
            thumb: {
                url: `${thumbUrl}:small`,
                aspectRatio: [4, 3],
            },
            video: {
                url: mediaUrl + '3.mp4',
                aspectRatio: [16, 9],
                durationMs: 5000,
            },
        },
    }

    expect(result).toEqual(expected)
})

test('getMediaList - gif', () => {
    const video_info = {
        aspect_ratio: [3, 2],
        duration_millis: 1700,
        variants: [
            { bitrate: 200, url: mediaUrl + '2.mp4' },
            { bitrate: 300, url: mediaUrl + '3.mp4' },
            { url: mediaUrl + '.mp4' },
            { bitrate: 100, url: mediaUrl + '1.mp4' },
        ],
    }

    const result = getMediaList({
        extended_entities: {
            media: [
                {
                    type: 'animated_gif',
                    video_info,
                    media_url_https: mediaUrl + '1.jpg?xxx',
                    sizes,
                },
            ],
        },
    } as any)

    const expected = {
        images: [],
        video: {
            type: 'gif',
            thumb: {
                url: mediaUrl + '1.jpg:small',
                aspectRatio: [4, 3],
            },
            video: {
                url: mediaUrl + '3.mp4',
                aspectRatio: [3, 2],
                durationMs: 1700,
            },
        },
    }

    expect(result).toEqual(expected)
})
