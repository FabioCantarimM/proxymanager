import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ProxyService } from 'util/proxy';
import { Request } from './request';

export class AxiosRequest extends Request {
  totalProxyAttempts = 0;

  /**
   * Send a request
   *
   * @param config Request configuration
   * @param proxies List of possible proxies
   * @returns The specified result type or throws an exception
   */
  public async sendRequest<U>(
    config: AxiosRequestConfig,
    proxy: ProxyService,
    connectionTimeoutInMS?: number,
  ): Promise<AxiosResponse<U>> {
    try {
      await proxy.loadProxyConfigByUrl(config.url);

      const { httpAgent, httpsAgent } = proxy.getProxyAgent();
      const { NO_PROXY = 0 } = process.env;
      let timeout: NodeJS.Timeout = null;
      let requestConfig = {
        ...config,
      };

      // const proxyValidation = await axios.get('http://lumtest.com/myip.json/', {
      //   httpAgent,
      //   httpsAgent,
      // });
      // console.log(proxyValidation);

      if (NO_PROXY.toString() === '0') requestConfig = { ...requestConfig, httpsAgent, httpAgent };

      if (connectionTimeoutInMS) {
        const controller = new AbortController();
        timeout = setTimeout(() => {
          controller.abort();
        }, connectionTimeoutInMS);
        requestConfig = { ...requestConfig, signal: controller.signal };
      }

      requestConfig.headers = {
        ...requestConfig.headers,
      };

      const response = await axios(requestConfig) as AxiosResponse<U>;
      clearTimeout(timeout);

      if (!response || !response.data) {
        const error = `Could not get response data. Response: ${JSON.stringify(response)}`;

        throw new Error(error);
      }

      if (proxy.currentProxy) {
        await proxy.storage?.persistUrl(config.url, proxy.currentProxy.getProps());
      }

      const requestByte = JSON.stringify(requestConfig.data === undefined ? '' : requestConfig.data);
      const responseByte = JSON.stringify(response?.data === undefined ? '' : response.data);

      await this.logger.network(
        'Successful axios request',
        Buffer.byteLength(requestByte),
        Buffer.byteLength(responseByte),
        proxy.currentProxy.name,
        this.totalProxyAttempts,
      );

      return response;
    } catch (err) {
      if (err instanceof AxiosError) {
        this.logger.debug(`Status code Error: ${err.response?.status}`);
      }
      if (proxy.proxyManagerIsEnabled()) {
        throw err;
      }

      proxy.changeProxy(true);
      this.totalProxyAttempts += 1;

      return await this.sendRequest(
        config,
        proxy,
      );
    }
  }
}
