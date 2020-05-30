import { JsonObject } from 'type-fest'
import { JsonObjectU } from '../types'

export const buildRequestData = (data: JsonObjectU) => {
    const filtered = Object.entries(data).reduce((a, [key, value]) => {
        return value != null ? { ...a, [key]: value } : a
    }, {} as JsonObject)

    return { ...filtered, tweet_mode: 'extended' }
}
