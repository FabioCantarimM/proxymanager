import { RequestAdapter } from './adapters/RequestAdapter'
import { Agent } from '../request/Agent'
import { HttpRequest } from '../request/HttpRequest'

export class HTTPEngine extends RequestAdapter {
  getRequester() {
    const url = new URL(this.uri)

    const httpOptions = {
      timeout: 3000,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': Agent.HTTP_USER_AGENT,
      } as Record<string, string>,
    }

    return new HttpRequest(url, this.maxRetries, httpOptions)
  }
}
