import * as http from 'http'
import * as net from 'net'
import { v4 as uuid } from 'uuid';
import { buildRequestEvent, paseHeadersConfigs, sendLog } from '../tools'
import { HeadersConfgType, ProxyConfig, ServerRule } from '../types'

export abstract class DefaultProxyServer {
  protected server: http.Server
  protected rule: ServerRule
  private timeout: number
  private proxyConfig: ProxyConfig
  private agent: Record<string, http.Agent> = {}

  constructor(rule: ServerRule) {
    this.rule = rule
    this.timeout = rule.timeout || 10 * 1000 // 10s
    this.proxyConfig = {}

    this.server = http.createServer(this.requestHandler.bind(this))

    this.server.on('connect', this.connectHandler.bind(this))
  }

  protected abstract generateProxyAuth(proxyConfig: ProxyConfig): string

  protected abstract getNewHeaders(httpHeaders:HeadersConfgType, proxyConfig:ProxyConfig): object

  protected setRequestOptions(req: http.IncomingMessage, res: http.ServerResponse): http.RequestOptions {
    const {httpHeaders, proxyConfig} = paseHeadersConfigs(req.headers)
    this.proxyConfig = proxyConfig
    const proxyHeaders = this.getNewHeaders(httpHeaders, proxyConfig)
    const newHeaders = { ...req.headers, ...proxyHeaders }

    const agent = this.getAgentBySessionID(proxyConfig.session_id ?? '1234');

    const options: http.RequestOptions = {
      agent,
      hostname: this.rule.proxy_host,
      port: this.rule.proxy_port,
      path: req.url,
      method: req.method,
      headers: newHeaders,
    }

    return options
  }

  protected requestHandler(req: http.IncomingMessage, res: http.ServerResponse): void {
    const requestId = uuid()
    const options = this.setRequestOptions(req, res)

    const proxy = http
      .request(options)
      .setTimeout(this.timeout, () => {
        proxy.emit('error', new Error(`Proxy request timed out after ${this.timeout} ms`))
      })
      .once('response', response => {
        console.log(`Response Status Code: ${res.statusCode}`)
        res.writeHead(response.statusCode || 500, response.headers)
        response.pipe(res, { end: true })

        const event = buildRequestEvent(requestId,0,this.proxyConfig, req, response)
        sendLog(event)
      })
      .on('timeout', (e: Error) => {
        if (e) proxy.emit('error', e)
      })
      .on('error', (err: Error) => {
        const event = buildRequestEvent( requestId,0,this.proxyConfig, req, undefined, err)
        sendLog(event)
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
      .on('timeout', (e: Error) => {
        if (e) serverSocket.emit('error', e)
      })
      .on('error', (err: Error) => {
        console.error(`Server socket error`, err)
        clientSocket.end()
        serverSocket.end()
      })
  }
  
  protected getAgentBySessionID(sessionId: string): http.Agent {
    let agent =  this.agent[sessionId]
    if (!agent){
      agent = new http.Agent({
        keepAlive: true,
        maxSockets: 10,
      })
      this.agent[sessionId] = agent
    }
    return agent    
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
