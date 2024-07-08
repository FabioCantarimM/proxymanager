import { createAxiosInstance } from '../lib/axios'
import { Numbers } from '../methods/numbers'
import { Agent } from '../request/Agent'
import { AxiosRequest } from '../request/AxiosRequest'
import { RequestAdapter } from './adapters/RequestAdapter'

export class AxiosEngine extends RequestAdapter {
  getRequester() {
    const url = new URL(this.uri)

    const httpAgent = Agent.createAxiosAgent('http', this.proxy)
    const httpsAgent = Agent.createAxiosAgent('https', this.proxy)

    const axiosClient = createAxiosInstance({
      axiosOptions: {
        timeout: 3000,
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml',
          'User-Agent': Agent.AXIOS_USER_AGENT,
        },
        httpAgent,
        httpsAgent,
      },
      /**
       * sets max 2 requests per 1 second, other will be delayed
       */
      rateLimitOptions: {
        maxRequests: 2,
        perMilliseconds: 1000,
        maxRPS: 2,
      },
      axiosRetryConfig: {
        retryDelay: Numbers.backoff, //TODO should be synchronized with task lock duration
        retries: 3, // Number of times to retry
      },
    })

    return new AxiosRequest(url, this.maxRetries, axiosClient)
  }
}
