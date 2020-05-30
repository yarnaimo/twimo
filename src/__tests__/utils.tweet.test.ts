import { Status } from 'twitter-d'
import {
    getTweetIdFromUrl,
    getUrlOfTweet,
    minusOne,
    originalTweet,
    plusOne,
} from '../utils/tweet'

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

test('getTweetIdFromUrl', () => {
    expect(getTweetIdFromUrl('https://twitter.com/yarnaimo/status/1234')).toBe(
        '1234',
    )
})
