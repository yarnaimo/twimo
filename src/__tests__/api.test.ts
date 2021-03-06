import nock from 'nock'
import OAuth from 'oauth-1.0a'
import { Status } from 'twitter-d'
import {
    createTweet,
    getMutedIds,
    lookupTweets,
    postThread,
    retweet,
    searchTweets,
} from '../api'
import { twget } from '../api-core'
import { baseUrl, pathToUrl, Twimo } from '../Twimo'
import { twitterConfig } from './__config__/twitter'

const { apiKeyOptions, tokenOptions } = twitterConfig
const twimo = Twimo(apiKeyOptions)(tokenOptions)
const n = nock(baseUrl)

const tweet_mode = 'extended'

describe('buildHeader', () => {
    const mockDate = new Date(1598422807597)
    let dateSpy: jest.SpyInstance<string, []>
    let getNonceSpy: jest.SpyInstance<string, []>

    beforeAll(() => {
        dateSpy = jest
            .spyOn(global, 'Date')
            .mockImplementation(() => (mockDate as unknown) as string)
        getNonceSpy = jest
            .spyOn(OAuth.prototype, 'getNonce')
            .mockImplementation(() => '1XKQ8G8FkIc2tmY0WD2RlREZn4NsJVne')
    })

    afterAll(() => {
        dateSpy.mockRestore()
        getNonceSpy.mockRestore()
    })

    test('get', () => {
        const result = twimo.buildHeader(pathToUrl('statuses/show'), 'GET', {
            id: '1234',
        })
        expect(result).toMatchSnapshot()
    })

    test('post', () => {
        const result = twimo.buildHeader(pathToUrl('statuses/update'), 'POST', {
            status: 'text',
        })
        expect(result).toMatchSnapshot()
    })
})

describe('get', () => {
    test('get', async () => {
        n.get('/statuses/home_timeline.json')
            .query({ tweet_mode, count: 3 })
            .reply(200, '[1,2,3]')

        const tweets = await twget<Status[]>(twimo, 'statuses/home_timeline', {
            count: 3,
            a: null,
        })

        expect(tweets.length).toBe(3)
    })

    test('lookupTweets', async () => {
        n.get('/statuses/lookup.json')
            .query({ tweet_mode, id: '1,3' })
            .reply(200, '[1,3]')

        const tweets = await lookupTweets(twimo, ['1', '3'])

        expect(tweets.length).toBe(2)
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

        const res = await searchTweets(twimo, { q, count: 2, maxId })

        expect(res).toEqual(response)
    })

    test('getMutedIds', async () => {
        const ids = ['23', '87']
        n.get('/mutes/users/ids.json')
            .query({ tweet_mode, stringify_ids: true })
            .reply(200, { ids })

        const res = await getMutedIds(twimo)

        expect(res).toEqual(ids)
    })
})

describe('post', () => {
    test('create tweet', async () => {
        const text = 'test'

        n.post('/statuses/update.json', {
            tweet_mode,
            status: text,
        }).reply(200, { full_text: text })

        const posted = await createTweet(twimo, text, { hoge: undefined })

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
            ].every((e) => e)
        })
            .twice()
            .reply(() => [200, responses.shift()])

        const posted = await postThread(twimo, ['test1', 'test2'])

        expect(posted).toEqual([{ id_str: '3' }, { id_str: '5' }])
    })

    test('retweet', async () => {
        const responseCodes = [200, 404, 200]

        n.post('/statuses/retweet.json', { tweet_mode, id: /\d+/ })
            .thrice()
            .reply(() => [responseCodes.shift(), { id_str: '3' }])

        const res = await retweet(twimo, ['1', '3', '5'])

        expect(res).toEqual([{ id_str: '3' }, { id_str: '3' }])
    })
})
