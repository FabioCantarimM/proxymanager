export interface ServerRule {
    port: number
    timeout?: number
    proxy_host?: string
    proxy_port?: number
    key?: string
    cert?: string
    user?: string
    pass?: string
    country?: string
    zone?: string
    additional?: Record<string, string | number | boolean | symbol>
  }