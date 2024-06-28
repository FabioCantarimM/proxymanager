import { readFileSync } from 'fs';
import { curly, CurlyResult } from 'node-libcurl';
import { CurlyOptions } from 'node-libcurl/dist/curly';
import { resolve } from 'path';
import { ProxyService } from 'util/proxy';
import { Request } from './request';

export interface CurlRequestConfig extends CurlyOptions {
  data: Record<string, unknown>,
  url: string,
  method: string,
  withCredentials?: boolean,
}

export class CurlRequest extends Request {
  totalProxyAttempts = 0;

  /**
   * Send a request
   *
   * @param config Request configuration
   * @param proxies List of possible proxies
   * @returns The specified result type or throws an exception
   */
  public async sendRequest<U>(
    config: CurlRequestConfig,
    proxy: ProxyService,
  ): Promise<CurlyResult<U>> {
    try {
      await proxy.loadProxyConfigByUrl(config.url);

      const requestConfig = config;
      requestConfig.httpHeader = [
        ...requestConfig.httpHeader,
      ];

      // testando o proxy vai retornar o IP do proxy e o pais de origem
      // const teste = await curly.get('http://lumtest.com/myip.json', {
      //   proxy: proxy.getProxyPlainConnection(),
      //   proxySslCert: readFileSync(resolve(__dirname, '../../proxy/service/cert.crt')).toString(),
      //   sslVerifyPeer: false,
      // });
      // console.log(teste);

      const response = await curly.post(config.url, {
        proxy: proxy.getProxyPlainConnection(),
        proxySslCert: readFileSync(resolve(__dirname, '../../proxy/service/cert.crt')).toString(),
        postFields: JSON.stringify(config.data),
        httpHeader: requestConfig.httpHeader,
        sslVerifyPeer: false,
        timeout: 240, // O timeout em segundos
      });

      if (!response || !response.data) {
        const error = `Could not get response data. Response: ${JSON.stringify(response)}`;

        throw new Error(error);
      }

      if (response.statusCode !== 200 || (response.data as Record<string, unknown>).status === 'failure') {
        const {
          data,
        } = response.data as {
          data: { message: string, code: string },
          status: number;
        };
        const error = {
          status: Number(data?.code),
          message: `Curl request error: ${data?.code} - ${data?.message}`,
        };
        throw new Error(JSON.stringify(error));
      }

      if (proxy.currentProxy) {
        await proxy.storage?.persistUrl(config.url, proxy.currentProxy.getProps());
      }

      const requestByte = JSON.stringify(config.data === undefined ? '' : config.data);
      const responseByte = JSON.stringify(response?.data === undefined ? '' : response.data);
      await this.logger.network(
        'Successful fetch request',
        Buffer.byteLength(requestByte),
        Buffer.byteLength(responseByte),
        proxy.currentProxy.name,
        this.totalProxyAttempts,
      );

      return response;
    } catch (err) {
      try {
        const parsedError = JSON.parse((err as Error).message) as { status: number, message: string };

        if (parsedError.status === 410) {
          throw err;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }

      if (proxy.proxyManagerIsEnabled()) {
        if (this.totalProxyAttempts === 0 && (err as Error).message.includes('socket hang up')) {
          this.totalProxyAttempts += 1;

          return this.sendRequest(config, proxy);
        }

        throw err;
      } else {
        proxy.changeProxy(true);
      }

      proxy.changeProxy(true);
      this.totalProxyAttempts += 1;
      return this.sendRequest(config, proxy);
    }
  }
}
