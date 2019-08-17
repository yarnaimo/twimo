import { Status } from 'twitter-d'
import {
    extractMediaListFromTweet,
    extractTweetIdFromUrl,
    getImageUrlWithSizeLabel,
    getUrlOfTweet,
    minusOne,
    originalTweet,
    plusOne,
} from '../utils'

test('plusOne', () => {
    expect(plusOne('17')).toBe('18')
})

test('minusOne', () => {
    expect(minusOne('17')).toBe('16')
})

test('originalTweet', () => {
    expect(
        originalTweet({ retweeted_status: { id_str: '3' } } as Status),
    ).toEqual({
        id_str: '3',
    })
})

test('getUrlOfTweet', () => {
    expect(
        getUrlOfTweet({
            retweeted_status: {
                id_str: '1234',
                user: { screen_name: 'yarnaimo' },
            },
        } as any),
    ).toEqual('https://twitter.com/yarnaimo/status/1234')
})

test('extractTweetIdFromUrl', () => {
    expect(
        extractTweetIdFromUrl('https://twitter.com/yarnaimo/status/1234'),
    ).toBe('1234')
})

const mediaUrl = 'https://pbs.twimg.com/media/a-Bc'

test('getOrigUrlFromTwimgUrl', () => {
    expect(getImageUrlWithSizeLabel('orig', mediaUrl + '.jpg?xxx')).toBe(
        mediaUrl + '.jpg:orig',
    )
    expect(
        getImageUrlWithSizeLabel('small', mediaUrl + '?a=b&format=png&c=d'),
    ).toBe(mediaUrl + '?format=png&name=small')
})

test('extractMediaListFromTweet - image', () => {
    const entities = [
        {
            type: 'photo',
            media_url_https: mediaUrl + '1.jpg?xxx',
        },
        {
            type: 'photo',
            media_url_https: mediaUrl + '2.jpg?xxx',
        },
        {
            type: 'video',
            media_url_https: mediaUrl + '3.mp4?xxx',
        },
    ]

    expect(
        extractMediaListFromTweet({
            extended_entities: { media: entities },
        } as any),
    ).toEqual([
        {
            type: 'image',
            url: mediaUrl + '1.jpg:orig',
            thumbUrl: mediaUrl + '1.jpg:small',
        },
        {
            type: 'image',
            url: mediaUrl + '2.jpg:orig',
            thumbUrl: mediaUrl + '2.jpg:small',
        },
    ])
})

test('extractMediaListFromTweet - video', () => {
    const video_info = {
        variants: [
            { bitrate: 200, url: mediaUrl + '2.mp4' },
            { bitrate: 300, url: mediaUrl + '3.mp4' },
            { url: mediaUrl + '.mp4' },
            { bitrate: 100, url: mediaUrl + '1.mp4' },
        ],
    }

    expect(
        extractMediaListFromTweet({
            extended_entities: {
                media: [
                    {
                        type: 'video',
                        video_info,
                        media_url_https:
                            'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a-Bc.jpg?xxx',
                    },
                ],
            },
        } as any),
    ).toEqual([
        {
            type: 'video',
            url: mediaUrl + '3.mp4',
            thumbUrl:
                'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a-Bc.jpg:small',
        },
    ])

    expect(
        extractMediaListFromTweet({
            extended_entities: {
                media: [
                    {
                        type: 'animated_gif',
                        video_info,
                        media_url_https: mediaUrl + '1.jpg?xxx',
                    },
                ],
            },
        } as any),
    ).toEqual([
        {
            type: 'gif',
            url: mediaUrl + '3.mp4',
            thumbUrl: mediaUrl + '1.jpg:small',
        },
    ])
})
