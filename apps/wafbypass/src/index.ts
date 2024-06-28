import { createServer } from './server'

const onCloseSignal = () => {
  process.exit(1)
}

process.on('SIGINT', onCloseSignal)
process.on('SIGTERM', onCloseSignal)

createServer()
