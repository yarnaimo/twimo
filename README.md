# twimo

## Install
```sh
yarn add @yarnaimo/twimo
# or
npm i -S @yarnaimo/twimo
```

## Usage
```ts
import {
    minusOne,
    originalTweet,
    plusOne,
    tweetToUrl,
    TwimoClient,
    urlToTweetId,
} from '@yarnaimo/twimo'
import { Status } from 'twitter-d'

const twimo = new TwimoClient({
  consumerKey: '***',
  consumerSecret: '***',
  token: '***',
  tokenSecret: '***',
})

const main = async () => {
  // Get 10 tweets from home timeline
  const tweets = await twimo.get<Status[]>('statuses/home_timeline', { count: 10 })
  const tweet = tweets[0]

  const url = tweetToUrl(tweet)

  const id = urlToTweetId(url)
  tweet.id_str === id // true

  // For timeline pagination
  const since_id = plusOne(tweets[0].id_str)
  const max_id = minusOne(tweets[tweets.length - 1].id_str)
}
```
