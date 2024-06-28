import { Routing } from 'express-zod-api'
import { crawler, health, logs, validateIP } from './endpoints'

const routing: Routing = {
  health,
  v1: {
    logs,
    crawler,
  },
  ip: {
    validate: validateIP,
  },
}

export { routing }
