export namespace Proxy {
  const SMARTPROXY_HEADER_PREFIX = 'smartproxy'

  enum ProxyType {
    RESIDENTIAL = 'residential',
    MOBILE = 'mobile',
    NO_PROXY = 'no_proxy',
  }

  interface Headers {
    [x: string]: string
  }
  export interface RequesterConfig {
    requester_group: string
    requester_id: string
    requester_links: string
    session_id: string
    session_ip: string
    provider: string
    proxy_type: string
    http_client: 'axios' | 'fetch' | 'request' | 'browser'
  }

  interface ParsedResult {
    httpHeaders: Headers
    requesterConfig: RequesterConfig
  }

  export interface Proxy {
    host: string
    username: string
    password: string
    port?: string
  }

  export function splitHeaders(
    requestHeaders: Record<string, any> | undefined,
    defaults: Partial<RequesterConfig>,
  ): ParsedResult {
    const httpHeaders: Headers = {}
    const requesterConfig: RequesterConfig = { ...defaults } as RequesterConfig

    if (!requestHeaders) return { httpHeaders, requesterConfig }
    const HEADER_PREFIX_SIZE = SMARTPROXY_HEADER_PREFIX.length

    for (const key in requestHeaders) {
      if (requestHeaders.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase()
        const value = requestHeaders[key]

        if (lowerKey.startsWith(SMARTPROXY_HEADER_PREFIX.toLowerCase())) {
          // Sum +1 to skip the dash
          const configName = lowerKey.slice(HEADER_PREFIX_SIZE + 1).replace(/-/g, '_') as keyof RequesterConfig
          requesterConfig[configName] = value // avoid overlap with defaults
        } else {
          httpHeaders[key] = value
        }
      }
    }

    const requester_group = requesterConfig.requester_group
    const requester_id = requesterConfig.requester_id
    const requester_links = requesterConfig.requester_links
    const session_id = requesterConfig.session_id
    const session_ip = requesterConfig.session_ip
    const proxy_type = requesterConfig.proxy_type || ProxyType.NO_PROXY
    const provider = requesterConfig.provider
    const http_client = requesterConfig.http_client

    return {
      httpHeaders,
      requesterConfig: {
        requester_group,
        requester_id,
        requester_links,
        session_id,
        session_ip,
        provider,
        proxy_type,
        http_client,
      },
    }
  }

  export function parseProxyString(proxyString?: string | null | undefined | unknown): Proxy | null {
    if (typeof proxyString !== 'string' || !proxyString?.length) return null
    // Regular expression to match 'user:pass@host:port'
    const regex = /^(?<user>[^:]+):(?<pass>[^@]+)@(?<host>[^:]+)(?::(?<port>\d+))?$/

    const match = proxyString.match(regex)
    if (match && match.groups)
      return {
        username: match.groups.user,
        password: match.groups.pass,
        host: match.groups.host,
        port: match.groups.port,
      } as Proxy

    return null
  }
}
