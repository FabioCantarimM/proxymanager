import { createConfig } from 'express-zod-api'
import { readFileSync } from 'fs'
import path from 'path'

const { PORT = '80' } = process.env

const cert = readFileSync(path.join(__dirname, 'cert/certificate.pem'), 'utf8')
const key = readFileSync(path.join(__dirname, 'cert/certificate.key'), 'utf8')

const config = createConfig({
  server: {
    listen: +PORT, // port, UNIX socket or options
  },
  https: {
    listen: +PORT + 1,
    options: { requestCert: true, rejectUnauthorized: false, ca: cert, cert, key },
  },
  cors: true,
  logger: { level: 'debug', color: true },
  startupLogo: false,
})

export { config }
