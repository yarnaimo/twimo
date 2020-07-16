import ky from 'ky-universal'
import { pathToUrl, Twimo } from './Twimo'
import { JsonObjectU } from './types'
import { buildRequestData } from './utils/_data'

/**
 * GETメソッドのTwitter API エンドポイントにリクエストを行います。
 */
export const twget = async <T extends object>(
    twimo: Twimo,
    path: string,
    params: JsonObjectU = {},
) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(params)

    const headers = twimo.buildHeader(url, 'GET', reqData)
    const response = await ky
        .get(url, {
            headers,
            searchParams: reqData,
        })
        .json<T>()
    return response
}

/**
 * POSTメソッドのTwitter API エンドポイントにリクエストを行います。
 */
export const twpost = async <T extends object>(
    twimo: Twimo,
    path: string,
    data: JsonObjectU = {},
) => {
    const url = pathToUrl(path)
    const reqData = buildRequestData(data)
    const searchParams = new URLSearchParams(reqData)

    const headers = twimo.buildHeader(url, 'POST', reqData)
    const response = await ky
        .post(url, {
            headers,
            body: searchParams,
        })
        .json<T>()
    return response
}
