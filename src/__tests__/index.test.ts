import * as config from 'config'
import * as nock from 'nock'
import { Status } from 'twitter-d'
import { baseUrl, TwimoClient } from '../TwimoClient'
import {
    extractMediaListFromTweet,
    extractTweetIdFromUrl,
    getOrigUrlFromTwimgUrl,
    getUrlOfTweet,
    minusOne,
    originalTweet,
    plusOne,
} from '../utils'

const twitterConfig = config.get<any>('twitter')
const twitter = TwimoClient(twitterConfig)
const n = nock(baseUrl)

const tweet_mode = 'extended'

describe('BigInt', () => {
    test('plusOne', () => {
        expect(plusOne('17')).toBe('18')
    })

    test('minusOne', () => {
        expect(minusOne('17')).toBe('16')
    })
})

describe('Utils', () => {
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
        expect(getOrigUrlFromTwimgUrl(mediaUrl + '.jpg?xxx')).toBe(
            mediaUrl + '.jpg:orig',
        )
        expect(getOrigUrlFromTwimgUrl(mediaUrl + '?format=png&xxx')).toBe(
            mediaUrl + '?format=png&name=orig',
        )
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
            { type: 'image', url: mediaUrl + '1.jpg:orig' },
            { type: 'image', url: mediaUrl + '2.jpg:orig' },
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
                    media: [{ type: 'video', video_info }],
                },
            } as any),
        ).toEqual([{ type: 'video', url: mediaUrl + '3.mp4' }])

        expect(
            extractMediaListFromTweet({
                extended_entities: {
                    media: [{ type: 'animated_gif', video_info }],
                },
            } as any),
        ).toEqual([{ type: 'gif', url: mediaUrl + '3.mp4' }])
    })
})

describe('TwimoClient', () => {
    test('get', async () => {
        n.get('/statuses/home_timeline.json')
            .query({ tweet_mode, count: 3 })
            .reply(200, '[1,2,3]')

        const tweets = await twitter.get<Status[]>('statuses/home_timeline', {
            count: 3,
            a: null,
        })
        expect(tweets.length).toBe(3)
    })

    test('create tweet', async () => {
        const text = 'test'

        n.post('/statuses/update.json', {
            tweet_mode,
            status: text,
        }).reply(200, { full_text: text })

        const posted = await twitter.createTweet(text, {
            hoge: undefined,
        })
        expect(posted.full_text).toBe(text)
    })

    test('post thread', async () => {
        const responses = [{ id_str: '3' }, { id_str: '5' }]

        n.post('/statuses/update.json', (body: any) => {
            const repId = body.in_reply_to_status_id
            return [
                body.tweet_mode === tweet_mode,
                /test\d/.test(body.status),
                !repId || repId === '3',
            ].every(e => e)
        })
            .twice()
            .reply(() => responses.shift())

        const posted = await twitter.postThread(['test1', 'test2'])

        expect(posted).toEqual([{ id_str: '3' }, { id_str: '5' }])
    })

    test('retweet', async () => {
        const responseCodes = [200, 404, 200]

        n.post('/statuses/retweet.json', { tweet_mode, id: /\d+/ })
            .thrice()
            .reply(() => [responseCodes.shift(), { id_str: '3' }])

        const res = await twitter.retweet(['1', '3', '5'])

        expect(res).toEqual([{ id_str: '3' }, { id_str: '3' }])
    })

    test('search', async () => {
        const response = [{ id_str: '1' }, { id_str: '3' }]
        const q = 'soko pick up'
        const maxId = '7'

        n.get('/search/tweets.json')
            .query({
                tweet_mode,
                q,
                count: 2,
                result_type: 'recent',
                max_id: maxId,
            })
            .reply(200, { statuses: response })

        const res = await twitter.searchTweets({ q, count: 2, maxId })

        expect(res).toEqual(response)
    })

    function v(type: string, variants: any) {
        return {
            extended_entities: {
                media: [
                    {
                        type,
                        video_info: {
                            variants,
                        },
                    },
                ],
            },
        }
    }
})
