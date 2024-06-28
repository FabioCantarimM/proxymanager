import https from 'https';
import { ProxyService } from 'util/proxy';
import { Request } from './request';

export interface HttpsRequestConfig extends https.RequestOptions {
  url: string,
}

export interface HandlerResultType<T> {
  status: string;
  data: T;
}

export class HttpsRequest extends Request {
  totalProxyAttempts = 0;

  /**
   * Send a request
   *
   * @param config Request configuration
   * @param proxies List of possible proxies
   * @returns The specified result type or throws an exception
   */
  public async sendRequest<U>(
    config: HttpsRequestConfig,
    proxy: ProxyService,
  ): Promise<HandlerResultType<U>> {
    await proxy.loadProxyConfigByUrl(config.url);

    const {
      headers, method, url, agent,
    } = config;

    const urlObj = new URL(url);
    const { host } = urlObj;
    const path = urlObj.pathname;
    const options: https.RequestOptions = {
      host,
      path,
      method,
      headers,
      agent: agent || null,
      timeout: 15000,
    };

    const response = await new Promise<HandlerResultType<U>>((resolve, reject) => {
      let responseBody = '';

      https
        .request(options, (res) => {
          res.setEncoding('utf8');

          res.on('data', (chunk: unknown) => {
            responseBody += chunk;
          });

          res.on('end', () => {
            try {
              resolve(JSON.parse(responseBody) as HandlerResultType<U>);
            } catch (e) {
              reject();
            }
          });

          res.on('error', (err) => {
            reject(err);
          });
        })
        .on('timeout', () => {
          reject(new Error(`HTTPS request timed out. Proxy service ${proxy.currentProxy.name}`));
        })
        .on('error', () => {
          reject(new Error(`HTTPS request failed. Proxy Service: ${proxy.currentProxy.name}`));
        })
        .end();
    });

    if (!(response instanceof Error) && response?.status === 'success') {
      if (proxy.currentProxy) {
        await proxy.storage?.persistUrl(config.url, proxy.currentProxy.getProps());
      }

      await this.logger.network(
        'Successful fetch request',
        0,
        Buffer.byteLength(JSON.stringify(response.data)),
        proxy.currentProxy.name,
        this.totalProxyAttempts,
      );
      return response;
    }

    const { httpsAgent } = this.proxyAgent(proxy.currentProxy.name);

    const handleOptions = {
      url,
      method,
      headers,
      agent: httpsAgent,
    };

    proxy.changeProxy(true);
    this.totalProxyAttempts += 1;
    return this.sendRequest(handleOptions, proxy);
  }
}
