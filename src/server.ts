import * as http from 'http';

export class ProxyServer {
  private server: http.Server;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.server = http.createServer(this.requestHandler.bind(this));
  }

  private getNewProxyAuth(user: string, country: string, session: string, password: string): string {
    const newAuth = `${user}-country-${country}-session-${session}-c_tag-${session}-debug-full-info:${password}`;
    const encodedAuth = Buffer.from(newAuth).toString('base64');
    return `Basic ${encodedAuth}`;
  }

  private requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const p = this.getNewProxyAuth(
      'brd-customer-hl_51a13a89-zone-smartproxy_dev_residential',
      'br',
      '550',
      'u72m129kbssk'
    );

    const newHeader = {
      ...req.headers,
      'Proxy-Authorization': p,
    };
    req.headers = newHeader;

    const options: http.RequestOptions = {
      hostname: 'brd.superproxy.io',
      port: 22225,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxy = http.request(options, proxyRes => {
      console.log(req.headers);
      console.log(proxyRes.headers);

      const ip = proxyRes.headers['x-luminati-ip'] as string;

      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, {
        end: true,
      });
    });

    req.pipe(proxy, {
      end: true,
    });

    proxy.on('error', (err: Error) => {
      console.error(`Proxy error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    });
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server running at http://localhost:${this.port}/`);
    });

    this.server.on('error', console.error);
  }
}

const PORT = 3000;
const proxyServer = new ProxyServer(PORT);
proxyServer.start();
