import * as http from 'http'
import * as https from 'https'
import tunnel from 'tunnel'

export namespace Agent {
  export namespace Tunnel {
    export type HttpOptions = tunnel.HttpOptions
  }
  export namespace Http {
    export type RequestOptions = http.RequestOptions
    export const request = http.request.bind(http)
  }

  export const AXIOS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
  export const HTTP_USER_AGENT =
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36'

  const commonOptions: http.AgentOptions | https.AgentOptions = {
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 10, // Adjust as needed
  }

  export const createAxiosAgent = (protocol: 'http' | 'https', proxy?: string) => {
    if (proxy) {
      const [ip, port] = proxy.split(':')
      commonOptions.port = +port
      commonOptions.host = ip
    }
    if (protocol === 'http') return new http.Agent(commonOptions)

    return new https.Agent(commonOptions)
  }

  export const createHttpAgent = (proxyOptions?: Tunnel.HttpOptions | null) =>
    tunnel.httpOverHttp({
      ...commonOptions,
      proxy: undefined,
      ...proxyOptions,
    })
}
