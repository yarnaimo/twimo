import { FullUser, Status } from 'twitter-d'
import { Merge } from 'type-fest'

export type FullStatus = Merge<Status, { user: FullUser }>
