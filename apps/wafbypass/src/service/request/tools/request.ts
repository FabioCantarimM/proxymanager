import { Agent } from 'http';
// eslint-disable-next-line import/no-extraneous-dependencies
import { httpOverHttp, httpsOverHttp } from 'tunnel';
import { ElasticSearchWriterLogWrapper } from 'util/logger/ElasticSearchWriterLogWrapper';
import { Task } from 'util/tasks';

interface ProxyAgentResultType {
  httpAgent: Agent,
  httpsAgent: Agent,
}

export interface ProxyConfig {
  username: string;
  password: string;
  port: string;
  server: string;
  extension: string;
  retry: number;
  auth?: string;
}

export abstract class Request {
  protected country: string;

  logger: ElasticSearchWriterLogWrapper<Task>;

  constructor(
    country: string,
    logger: ElasticSearchWriterLogWrapper<Task>,
  ) {
    this.country = (country && country.toLowerCase()) || 'us';
    this.logger = logger;
  }

  public proxyAgent(proxyName: string): ProxyAgentResultType {
    const { PROXY_CONFIGS } = process.env;
    const proxy = JSON.parse(PROXY_CONFIGS) as Record<string, ProxyConfig>;
    const proxyConf = proxy[proxyName];

    const {
      username, password, port, server, extension,
    } = proxyConf;

    if (!proxyConf.username || !proxyConf.password) {
      throw new Error('No proxy left');
    }

    const sessionId = Math.round(1000000 * Math.random());

    const { country } = this;

    const auth = `${username}${extension}:${password}`
      .replace('{{Session}}', String(sessionId))
      .replace('{{Country}}', country);

    const proxyAgent = {
      host: server,
      port: Number(port),
      proxyAuth: auth,
      rejectUnauthorized: false,
    };

    return {
      httpAgent: httpOverHttp({ proxy: proxyAgent }),
      httpsAgent: httpsOverHttp({ proxy: proxyAgent }),
    };
  }

  public static curlProxy(proxyName: string): ProxyConfig {
    const { PROXY_CONFIGS = '{"none":"none"}' } = process.env;

    const config = JSON.parse(PROXY_CONFIGS) as Record<string, ProxyConfig>;
    const proxyConf = config[proxyName || 'lum-datacenter'];

    if (!proxyConf.username || !proxyConf.password) {
      throw new Error('No proxy left');
    }

    const sessionId = Math.round(1000000 * Math.random());
    const auth = `${proxyConf.username}-session-${sessionId}:${proxyConf.password}`;
    const proxy = {
      ...proxyConf,
      auth,
    };

    return proxy;
  }
}
