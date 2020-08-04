import { FullUser } from 'twitter-d'
import { TweetURL, UserPageURL } from '..'
import { FullStatus } from '../types'

describe('TweetURL', () => {
    const expected = {
        tweetId: '12345678',
        screenName: 'Twitter',
        normalized: 'https://twitter.com/Twitter/status/12345678',
    }

    test('parse', () => {
        const urls = [
            'https://twitter.com/Twitter/status/12345678',
            'https://twitter.com/Twitter/status/12345678?foo=bar',
            'https://mobile.twitter.com/Twitter/status/12345678',
            'https://mobile.twitter.com/Twitter/status/12345678?foo=bar',
        ]
        for (const url of urls) {
            const result = TweetURL.parse(url)
            expect(result).toEqual(expected)
        }

        expect(TweetURL.parse('https://twitter.com/Twitter')).toBe(null)
        expect(
            TweetURL.parse('https://example.com/Twitter/status/12345678'),
        ).toBe(null)
    })

    test('fromTweet', () => {
        const tweets = [
            {
                id_str: '12345678',
                user: { screen_name: 'Twitter' },
            },
            {
                retweeted_status: {
                    id_str: '12345678',
                    user: { screen_name: 'Twitter' },
                },
            },
        ]

        for (const tweet of tweets) {
            const result = TweetURL.fromTweet(tweet as FullStatus)
            expect(result).toEqual(expected)
        }
    })
})

describe('UserPageURL', () => {
    const expected = {
        screenName: 'Twitter',
        normalized: 'https://twitter.com/Twitter',
    }

    test('parse', () => {
        const urls = [
            'https://twitter.com/Twitter',
            'https://twitter.com/Twitter?foo=bar',
            'https://mobile.twitter.com/Twitter',
            'https://mobile.twitter.com/Twitter?foo=bar',
        ]

        for (const url of urls) {
            const parsed = UserPageURL.parse(url)
            expect(parsed).toEqual(expected)
        }

        expect(UserPageURL.parse('https://example.com/Twitter')).toBe(null)
    })

    test('fromUser', () => {
        const user = {
            screen_name: 'Twitter',
        } as FullUser

        const result = UserPageURL.fromUser(user)
        expect(result).toEqual(expected)
    })
})
