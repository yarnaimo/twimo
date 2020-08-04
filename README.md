# twimo

Twitter library for TypeScript

## Install

```sh
yarn add @yarnaimo/twimo
# or
npm i -S @yarnaimo/twimo
```

## Usage

```ts
import { Twimo, twget, twpost } from '@yarnaimo/twimo'
import { Status } from 'twitter-d'

const twimo = Twimo({
    consumerKey: '***',
    consumerSecret: '***',
})({
    token: '***',
    tokenSecret: '***',
})

const response = await twget<Status>(twimo, 'statuses/show', params)

const response = await twpost<ResponseType>(twimo, path, params)
```

## Shorthands

-   twget
    -   lookupTweets
    -   searchTweets
    -   getMutedIds
-   twpost
    -   createTweet
    -   postThread
    -   retweet

**Example**

```ts
import { lookupTweets } from '@yarnaimo/twimo'

const response = await lookupTweets(twimo, ['123', '456'])
```

## Utils

-   plusOne
-   minusOne
-   originalTweet
-   getMediaList
-   TweetURL
    -   parse
    -   fromTweet
-   UserPageURL
    -   parse
    -   fromUser
