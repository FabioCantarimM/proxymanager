import { defaultEndpointsFactory } from 'express-zod-api'
import { z } from 'zod'
import { MercadoLivreCrawler } from '../service/crawler'
import { LuminatiProxyManager } from '../service/lpm'

const { PROXY_PEER } = process.env as Record<string, string>

const validateIP = defaultEndpointsFactory.build({
  method: 'get',
  input: z.object({
    ip: z.string().ip(),
  }),
  output: z.object({
    ip: z.string().ip(),
    validated: z.boolean(),
    message: z.string(),
  }),
  handler: async ({ input }) => {
    const { ip } = input

    // ip

    return { ip, message: 'is ok', validated: true }
  },
})

const crawler = defaultEndpointsFactory.build({
  method: 'get',
  input: z.object({}),
  output: z.object({ items: z.array(z.any()).nullable() }),
  handler: async ({}) => {
    const crawler = new MercadoLivreCrawler()
    const totalPages = 1 // Defina o número total de páginas a serem verificadas
    const items = await crawler.getAllData('iphone', totalPages)
    return { items }
  },
})

const logs = defaultEndpointsFactory.build({
  method: 'get',
  input: z.object({}),
  output: z.object({
    logs: z.any(),
  }),
  handler: async ({}) => {
    const lpm = new LuminatiProxyManager(PROXY_PEER)
    const logs = await lpm.getLogs()
    return { logs }
  },
})
const health = defaultEndpointsFactory.build({
  method: 'get',
  input: z.object({}),
  output: z.object({
    status: z.literal('UP'),
  }),
  handler: async ({ input: {}, options, logger }) => {
    logger.debug('Options:', options) // middlewares provide options
    return { status: 'UP' } as const
  },
})

export { crawler, health, logs, validateIP }
