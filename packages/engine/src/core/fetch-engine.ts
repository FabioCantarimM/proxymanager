import { Agent } from '../request/Agent'
import { FetchRequest } from '../request/FetchRequest'
import { RequestAdapter } from '../request/adapters/RequestAdapter'

export class FetchEngine extends RequestAdapter {
  getRequester() {
    const url = new URL(this.uri)

    const fetchOptions: RequestInit = {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': Agent.HTTP_USER_AGENT,
      },
      method: 'get',
    }

    return new FetchRequest(url, this.maxRetries, fetchOptions)
  }
}
