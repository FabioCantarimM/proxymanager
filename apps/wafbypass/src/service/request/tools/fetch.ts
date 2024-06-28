import fetch, { RequestInit } from 'node-fetch';
import { ProxyService } from 'util/proxy';
import { Request } from './request';

export interface FetchRequestConfig extends RequestInit {
  data: Record<string, unknown>,
  url: string,
  withCredentials?: boolean,
}

export class FetchRequest extends Request {
  totalProxyAttempts = 0;

  /**
   * Send a request
   *
   * @param config Request configuration
   * @param proxies List of possible proxies
   * @returns The specified result type or throws an exception
   */
  public async sendRequest<U>(
    config: FetchRequestConfig,
    proxy: ProxyService,
    getHeaders?: boolean,
  ): Promise<{
      status: string,
      code?: number | string,
      data: U,
    } | U> {
    try {
      await proxy.loadProxyConfigByUrl(config.url);

      const requestConfig = config;

      const { url } = requestConfig;
      const { httpsAgent } = proxy.getProxyAgent();

      requestConfig.headers = {
        ...config.headers,
        // 'x-lpm-country': this.country.toLowerCase(),
      };

      // const proxyValidation = await fetch('http://lumtest.com/myip.json', {
      //   agent: httpsAgent,
      // });
      // console.log(proxyValidation.ok);
      // console.log(proxyValidation.status);
      // console.log(proxyValidation.statusText);
      // const proxyResult = await proxyValidation.json() as unknown;
      // console.log(proxyResult);

      const response = await fetch(url, {
        ...requestConfig,
        agent: httpsAgent,
        body: JSON.stringify(config.data),
        timeout: 300000,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      if (getHeaders) {
        const cookie = { cookie: response.headers.get('set-cookie') };
        return JSON.parse(JSON.stringify(cookie)) as U;
      }

      const result = await response.json() as {
        status: string,
        code?: number | string,
        data: U,
      };

      if (!result.status || result.status !== 'success') {
        throw new Error(`Request failed with ${result.status}`);
      }
      if (!Object.keys(result.data).length) {
        throw new Error('No response');
      }

      if (proxy.currentProxy) {
        await proxy.storage?.persistUrl(config.url, proxy.currentProxy.getProps());
      }

      const requestByte = JSON.stringify(config.data === undefined ? '' : config.data);
      const responseByte = JSON.stringify(result?.data === undefined ? '' : result.data);
      await this.logger.network(
        'Successful fetch request',
        Buffer.byteLength(requestByte),
        Buffer.byteLength(responseByte),
        proxy.currentProxy.name,
        this.totalProxyAttempts,
      );

      return result;
    } catch (err) {
      if (proxy.proxyManagerIsEnabled()) {
        if (this.totalProxyAttempts === 0 && (err as Error).message.includes('socket hang up')) {
          this.totalProxyAttempts += 1;

          return await this.sendRequest(config, proxy, getHeaders);
        }

        throw err;
      } else {
        proxy.changeProxy(true);
      }
      this.totalProxyAttempts += 1;

      return await this.sendRequest(config, proxy, getHeaders);
    }
  }
}
