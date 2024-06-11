import { BrightDataProxyServer } from './server/brightdata'
import { ServerRule } from './server/default'
import 'dotenv/config';


const { PROXY_USER, PROXY_PASS, PROXY_ZONE, PROXY_COUNTRY } = process.env

const rule: ServerRule = {
  port: 80,
  timeout: 10000,  
  user: PROXY_USER,
  pass: PROXY_PASS,
  country: PROXY_COUNTRY,
  zone: PROXY_ZONE,
  additional: {
    country: 'br',
    session: '12345',
  },
}

new BrightDataProxyServer(rule).start()