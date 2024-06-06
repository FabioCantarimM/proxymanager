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

const log = (x: string) => {
  console.log(x)
  return () => {}
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

    console.log(req.url)

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
    req
      .on('close', log('req.close'))
      .on('data', log('req.data'))
      .on('end', log('req.end'))
      .on('error', log('req.error'))
      .on('pause', log('req.pause'))
      .on('readable', log('req.readable'))
      .on('resume', log('req.resume'))

    res
      .on('close', log('proxy.res.close'))
      .on('drain', log('proxy.res.drain'))
      .on('error', log('proxy.res.error'))
      .on('finish', log('proxy.res.finish'))
      .on('pipe', log('proxy.res.pipe'))
      .on('unpipe', log('proxy.res.unpipe'))

    const options = this.setRequestOptions(req, res)

    const proxy = http
      .request(options)
      .setTimeout(this.timeout, () => {
        proxy.emit('error', new Error(`Proxy request timed out after ${this.timeout} ms`))
      })
      .once('response', response => {
        res.writeHead(response.statusCode || 500, response.headers)
        response.pipe(res, { end: true })
      })
      .on('abort', log('proxy.abort'))
      .on('close', log('proxy.close'))
      .on('connect', log('proxy.connect'))
      .on('continue', log('proxy.continue'))
      .on('drain', log('proxy.drain'))
      .on('finish', log('proxy.finish'))
      .on('information', log('proxy.information'))
      .on('pipe', log('proxy.pipe'))
      .on('response', log('proxy.response'))
      .on('socket', log('proxy.socket'))
      .on('timeout', (e: Error) => {
        if (e) proxy.emit('error', e)
      })
      .on('unpipe', log('proxy.unpipe'))
      .on('upgrade', log('proxy.upgrade'))
      .on('error', (err: Error) => {
        console.error('proxy.error', err)

        if (!res.writableFinished) {
          if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end(err.message)
        }
      })

    req.pipe(proxy, {
      end: true,
    })
  }

  protected connectHandler(req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer): void {
    const url = new URL(`http://${req.url}`)
    const { port, hostname } = url
    console.log(req.url, url)
    const serverSocket = net
      .connect(+port || 443, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node.js-Proxy\r\n' + '\r\n')
        serverSocket.write(head)
        serverSocket.pipe(clientSocket)
        clientSocket.pipe(serverSocket)
      })
      .on('close', log('close'))
      .on('connect', log('connect'))
      .on('connectionAttempt', log('connectionAttempt'))
      .on('connectionAttemptFailed', log('connectionAttemptFailed'))
      .on('connectionAttemptTimeout', log('connectionAttemptTimeout'))
      .on('data', log('data'))
      .on('drain', log('drain'))
      .on('end', log('end'))
      .on('lookup', log('lookup'))
      .on('ready', log('ready'))
      .on('timeout', log('timeout'))
      .on('error', (err: Error) => {
        console.error(`Server socket error`, err)
        clientSocket.end()
        serverSocket.end()
      })
  }

  public start(): void {
    const onCloseSignal = () => {
      this.close()
      process.exit(1)
    }
    this.server.listen(this.rule.port, () => {
      process.on('SIGINT', onCloseSignal)
      process.on('SIGTERM', onCloseSignal)
      console.log(`Server running at http://localhost:${this.rule.port}/`)
    })

    this.server.on('error', err => {
      console.error('Proxy server error:', err)
    })
  }
  close() {
    this.server.close()
    console.log('Proxy closed')
  }
}
