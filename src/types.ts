import { FullUser, Status } from 'twitter-d'
import { JsonValue, Merge } from 'type-fest'

export type FullStatus = Merge<Status, { user: FullUser }>

export type JsonObjectU = { [key: string]: JsonValue | undefined }

export type TwitterAPIKeyOptions = {
    consumerKey: string
    consumerSecret: string
}
export type TwitterTokenOptions = {
    token: string
    tokenSecret: string
}
