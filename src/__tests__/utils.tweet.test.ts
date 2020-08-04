import { Status } from 'twitter-d'
import { minusOne, originalTweet, plusOne } from '..'

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
