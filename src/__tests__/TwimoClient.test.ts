import config from 'config'
import nock from 'nock'
import { Status } from 'twitter-d'
import { baseUrl, TwimoClient } from '../TwimoClient'

const twitterConfig = config.get<any>('twitter')
const twitter = TwimoClient(twitterConfig)
const n = nock(baseUrl)

const tweet_mode = 'extended'

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
        .reply(() => [200, responses.shift()])

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
