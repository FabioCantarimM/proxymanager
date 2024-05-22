import { BrightDataProxyServer } from './server/brightdata';
import { ServerRule } from './server/default';

const { PROXY_USER, PROXY_PASS } = process.env;

const rule: ServerRule = {
  port: 80,
  proxy_host: 'brd.superproxy.io',
  proxy_port: 22225,
  user: PROXY_USER,
  pass: PROXY_PASS,
  additional: {
    country: 'br',
    session: '12345',
  },
};

const server = new BrightDataProxyServer(rule);

server.start();
