import { HeadersConfgType, ProxyConfig, ServerRule } from '../types'
import { DefaultProxyServer} from './default'

export class BrightDataProxyServer extends DefaultProxyServer {
  private user = '';
  private password = '';
  private country = '';
  private zone = '';
  
  constructor(rule: ServerRule) {
    super({ proxy_host: 'brd.superproxy.io', proxy_port: 22225, ...rule })
  }

  protected generateProxyAuth(proxyConfig: ProxyConfig): string {
    
    const { user, pass, country, zone, additional } = this.rule;
    const { proxy_username, proxy_password, proxy_country, proxy_zone } = proxyConfig;

    this.user = proxy_username ? proxy_username : user ?? '';
    this.password = proxy_password ? proxy_password : pass ?? '';
    this.country = proxy_country ? proxy_country : country ?? 'br';
    this.zone = proxy_zone ? proxy_zone : zone ?? '';

    if (!this.user) {
      throw new Error('Missing proxy username')
    }
    let session = (1000000 * Math.random()).toString();
    let debug = true

    if (additional) {
      for (const key of Object.keys(additional)) {
        if (key === 'session') {
          session = additional[key].toString()
        }
      }
    }

    const newAuth = `${this.user}-zone-${this.zone}-country-${this.country}-session-${session}-c_tag-${session}${debug ? '-debug-full-info' : ''}:${this.password}`
    const encodedAuth = Buffer.from(newAuth).toString('base64')
    return `Basic ${encodedAuth}`
  }

  protected getNewHeaders(httpHeaders:HeadersConfgType, proxyConfig:ProxyConfig): object {
    const proxyAuth = this.generateProxyAuth(proxyConfig)

    const newHeader = {
      ... httpHeaders,
      'Proxy-Authorization': proxyAuth,
    }

    return newHeader
  }
}
