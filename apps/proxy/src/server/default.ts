import * as http from 'http'
import * as net from 'net'

export interface ServerRule {
  port: number
  timeout?: number
  proxy_host?: string
  proxy_port?: number
  key?: string
  cert?: string
  user?: string
  pass?: string
  additional?: Record<string, string | number | boolean | symbol>
}

export abstract class DefaultProxyServer {
  protected server: http.Server
  protected rule: ServerRule
  private timeout: number

  constructor(rule: ServerRule) {
    this.rule = rule
    this.timeout = rule.timeout || 10 * 1000 // 10s

    this.server = http.createServer(this.requestHandler.bind(this))

    this.server.on('connect', this.connectHandler.bind(this))
  }

  protected abstract generateProxyAuth(): string

  protected abstract getNewHeaders(): object

  protected setRequestOptions(req: http.IncomingMessage, res: http.ServerResponse): http.RequestOptions {
    const proxyHeaders = this.getNewHeaders()
    const newHeaders = { ...req.headers, ...proxyHeaders }

    const options: http.RequestOptions = {
      hostname: this.rule.proxy_host,
      port: this.rule.proxy_port,
      path: req.url,
      method: req.method,
      headers: newHeaders,
    }

    return options
  }

  protected requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const options = this.setRequestOptions(req, res)

    const proxy = http.request(options, proxyRes => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
      proxyRes.pipe(res, {
        end: true,
      })
    })

    req.pipe(proxy, {
      end: true,
    })

    proxy.setTimeout(this.timeout, () => {
      console.error(`Proxy request timed out after ${this.timeout} ms`)
      proxy.emit('timeout', new Error(`Proxy request timed out after ${this.timeout} ms`))
    })

    const log = (x: string) => {
      return console.log.bind(console, x)
    }

    proxy.on('response', () => console.log('response'))

    proxy.on('upgrade', log('upgrade'))

    proxy.on('connect', log('connect'))

    proxy.on('close', log('close'))

    proxy.on('finish', log('finish'))

    proxy.on('timeout', (e: Error) => {
      console.error(e)
      proxy.emit('close')
    })

    proxy.on('abort', log('abort'))

    proxy.on('error', (err: Error) => {
      console.error(`Proxy error: ${err.message}`)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end(`Internal server error ${err.message}`)
    })
  }

  protected connectHandler(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer): void {
    const { port, hostname } = new URL(`http://${req.url}`)
    const serverSocket = net.connect(+port || 443, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node.js-Proxy\r\n' + '\r\n')
      serverSocket.write(head)
      serverSocket.pipe(clientSocket)
      clientSocket.pipe(serverSocket)
    })

    serverSocket.on('error', (err: Error) => {
      console.error(`Server socket error: ${err.message}`)
      clientSocket.end()
    })
  }

  public start(): void {
    this.server.listen(this.rule.port, () => {
      console.log(`Server running at http://localhost:${this.rule.port}/`)
    })

    this.server.on('error', err => {
      console.error('Proxy server error:', err)
    })
  }
}
