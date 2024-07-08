import { Retryable } from '../lib/Retryable'
import { Response } from '../lib/response'
import { Agent } from './Agent'

export class HttpRequest implements Retryable.Requester<Response<string>> {
  options: Agent.Http.RequestOptions
  constructor(
    readonly url: URL,
    readonly maxRetries: number,
    options?: Agent.Http.RequestOptions | null,
    proxyOptions?: Agent.Tunnel.HttpOptions | null,
  ) {
    this.options = options ?? {}
    this.options.method = 'GET'
    if (proxyOptions) {
      this.options['agent'] = Agent.createHttpAgent(proxyOptions)
    }
  }

  execute() {
    return new Promise<Response<string>>((resolve, reject) =>
      Agent.Http.request(this.url, this.options, res => {
        let data = ''

        res.on('data', chunk => {
          data += chunk
        })

        res.on('end', () => {
          const status = res.statusCode ?? 500
          const statusText = res.statusMessage ?? 'Unknown error'
          const headers = JSON.parse(JSON.stringify(res.headers))

          let success = status >= 200 && status < 400

          const response = Response.makeResponse({
            success,
            data,
            status,
            statusText,
            headers,
          })

          resolve(response)
        })
      })
        .on('error', reject)
        .end(),
    )
  }
}
