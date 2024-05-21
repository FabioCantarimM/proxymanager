import * as http from 'http';

export interface ServerRule {
  port: number;
  proxy_host: string;
  proxy_port: number;
  user?: string;
  pass?: string;
  additional?: Record<string, string|number|boolean|symbol>;
}

export abstract class DefaultProxyServer {
  protected server: http.Server;
  protected rule: ServerRule;

  constructor(rule: ServerRule) {
    this.rule = rule;
    this.server = http.createServer(this.requestHandler.bind(this));
  }

  protected abstract generateProxyAuth(): string;

  protected abstract getNewHeaders(): object;

  protected requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const proxyHeaders = this.getNewHeaders();
    const newHeaders = { ...req.headers, ...proxyHeaders };

    const options: http.RequestOptions = {
      hostname: this.rule.proxy_host,
      port: this.rule.proxy_port,
      path: req.url,
      method: req.method,
      headers: newHeaders,
    };

    const proxy = http.request(options, proxyRes => {
        console.log(req.headers);
        console.log(proxyRes.headers);
    
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, {
          end: true,
        });
   });

    req.pipe(proxy, {
        end: true,
    });
  }

  public start(): void {
    this.server.listen(this.rule.port, () => {
      console.log(`Server running at http://localhost:${this.rule.port}/`);
    });
  }
}
