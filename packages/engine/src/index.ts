import { AxiosEngine } from './core/axios-engine'
import { FetchEngine } from './core/fetch-engine'
import { HTTPEngine } from './core/http-engine'
import { Response } from './lib/response'

export * from './core/adapters/RequestAdapter'

/**
 * A collection of available engines for making HTTP requests.
 *
 * @const {Object} engines
 * @property {AxiosEngine} axios - The Axios engine.
 * @property {FetchEngine} fetch - The Fetch engine.
 * @property {HTTPEngine} http - The HTTP engine.
 */
export const engines = {
  axios: AxiosEngine,
  fetch: FetchEngine,
  http: HTTPEngine,
} as const

/**
 * Sends an HTTP request using the specified client engine.
 *
 * @async
 * @function request
 * @param {keyof typeof engines} client - The key of the client engine to use (axios, fetch, or http).
 * @param {string} uri - The URI to which the request will be sent.
 * @param {string} [proxy] - Optional proxy server to route the request through.
 * @returns {Promise<Response<string>>} A promise that resolves to the result of the HTTP request.
 */
export async function request(client: keyof typeof engines, uri: string, proxy?: string): Promise<Response<string>> {
  return new engines[client](uri, proxy).execute()
}
