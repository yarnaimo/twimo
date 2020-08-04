import { FullUser } from 'twitter-d'
import { FullStatus } from '../types'
import { originalTweet } from './tweet'

const matchGroups = <T extends object>(pattern: RegExp, str: string) => {
    const matched = str.match(pattern)
    return matched?.groups ? (matched.groups as T) : null
}

export type TweetURL = {
    tweetId: string
    screenName: string
    normalized: string
}

export type UserPageURL = {
    screenName: string
    normalized: string
}

const buildTweetUrl = ({
    screenName,
    tweetId,
}: {
    screenName: string
    tweetId: string
}): TweetURL => ({
    screenName,
    tweetId,
    normalized: `https://twitter.com/${screenName}/status/${tweetId}`,
})

const buildUserPageUrl = ({
    screenName,
}: {
    screenName: string
}): UserPageURL => ({
    screenName,
    normalized: `https://twitter.com/${screenName}`,
})

const tweetUrlPattern = /^https:\/\/(?:mobile\.)?twitter.com\/(?<screenName>\w+)\/status\/(?<tweetId>\d+)/

export const TweetURL = {
    parse: (url: string): TweetURL | null => {
        const groups = matchGroups<{ screenName: string; tweetId: string }>(
            tweetUrlPattern,
            url,
        )
        return groups && buildTweetUrl(groups)
    },

    fromTweet: (t: FullStatus): TweetURL => {
        const {
            id_str: tweetId,
            user: { screen_name: screenName },
        } = originalTweet(t) as FullStatus

        return buildTweetUrl({ screenName, tweetId })
    },
}

const userPageUrlPattern = /^https:\/\/(?:mobile\.)?twitter.com\/(?<screenName>\w+)/

export const UserPageURL = {
    parse: (url: string): UserPageURL | null => {
        const groups = matchGroups<{ screenName: string }>(
            userPageUrlPattern,
            url,
        )
        return groups && buildUserPageUrl(groups)
    },

    fromUser: ({ screen_name: screenName }: FullUser): UserPageURL => {
        return buildUserPageUrl({ screenName })
    },
}
