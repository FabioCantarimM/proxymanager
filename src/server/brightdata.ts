import { DefaultProxyServer, ServerRule } from './default';

export class BrightDataProxyServer extends DefaultProxyServer {
  constructor(rule: ServerRule) {
    super(rule);
  }

  protected generateProxyAuth(): string {
    const { user, pass, additional } = this.rule;

    let country = 'br';
    let session = '1234';
    let debug = true;

    if (additional) {
        for (const key of Object.keys(additional)) {
          if (key === "country") {
            country = additional[key].toString();
          }
          if (key === "session") {
            session = additional[key].toString();
          }
        }
      }

    const newAuth = `${user}-country-${country}-session-${session}-c_tag-${session}${debug ? "-debug-full-info" : ""}:${pass}`;
    const encodedAuth = Buffer.from(newAuth).toString('base64');
    return `Basic ${encodedAuth}`;
  }
  
  protected getNewHeaders(): object {
    const proxyAuth = this.generateProxyAuth();

    const newHeader = {
      'Proxy-Authorization': proxyAuth,
    };

    return newHeader;
  }
}
