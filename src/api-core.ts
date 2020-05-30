import got from 'got'
import { pathToUrl, Twimo } from './Twimo'
import { JsonObjectU } from './types'
import { buildRequestData } from './utils/_data'

/**
 * GETメソッドのTwitter APIにリクエストを行います。
 */
export const twget = <T extends object>(
    twimo: Twimo,
    path: string,
    params: JsonObjectU = {},
) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(params)

    const headers = twimo.buildHeader(url, 'GET', reqData)
    return got
        .get(url, {
            headers,
            searchParams: reqData,
        })
        .json<T>()
}

/**
 * POSTメソッドのTwitter APIにリクエストを行います。
 */
export const twpost = <T extends object>(
    twimo: Twimo,
    path: string,
    data: JsonObjectU = {},
) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(data)

    const headers = twimo.buildHeader(url, 'POST', reqData)
    return got
        .post(url, {
            headers,
            form: reqData,
        })
        .json<T>()
}