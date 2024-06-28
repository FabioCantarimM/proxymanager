import { createServer as createZodServer } from 'express-zod-api'
import { routing } from './api/router'
import { config } from './server/config'

const createServer = (c?: typeof config) => createZodServer({ ...config, ...c }, routing)

export { createServer }
