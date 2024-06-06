import chalk from 'chalk'
import winston from 'winston'
import { LogLevel } from './types'
export * from './types'

export const winstonLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(info => info.message),
  ),
  transports: [new winston.transports.Console()],
})

// Store the original console methods
const originalConsole = {
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
  warn: console.warn.bind(console),
} as const

function customLogger(level: LogLevel, color: chalk.Chalk) {
  return function (...args: any[]) {
    const formattedMessage = args
      .map(arg => {
        if (arg instanceof Error) return arg.toString()

        if (Array.isArray(arg) || typeof arg === 'object') return JSON.stringify(arg, null, 0)

        return String(arg)
      })
      .map(arg => color(arg))
      .join('\n')
    return winstonLogger[level](formattedMessage)
  }
}

// Override the console methods with custom logger functions
const customConsole: Partial<Record<keyof typeof console, (typeof console)[keyof typeof console]>> = {}
customConsole.error = customLogger('error', chalk.red)
customConsole.info = customLogger('info', chalk.green)
customConsole.debug = customLogger('debug', chalk.magenta)
customConsole.warn = customLogger('warn', chalk.yellow)
customConsole.log = customLogger('info', chalk.blue)
customConsole.trace = customLogger('debug', chalk.cyan)

console = Object.assign(console, customConsole)

interface LoggerParams {
  type: keyof typeof originalConsole
  inputs: boolean
}

/**
 * Decorator logging functions arguments
 * @param params
 * @returns
 */
export function Log(params?: Partial<LoggerParams>) {
  const options: LoggerParams = {
    type: params?.type || 'debug',
    inputs: params?.inputs === undefined ? true : params.inputs === true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <T extends Object>(target: T, propertyKey: Exclude<keyof T, Symbol>, descriptor: PropertyDescriptor) => {
    const original: Function = descriptor.value

    const key = `${target.constructor.name}:${propertyKey}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args: any[]) {
      console[options.type](key, ...args)

      return original.apply(this, args)
    }
  }
}

/**
 * Decorator for logging execution time. Use it in functions and methods.
 * @returns
 */
export function logFn() {
  return <T extends Object>(target: T, propertyKey: Exclude<keyof T, Symbol>, descriptor: PropertyDescriptor) => {
    const original: (...args: Array<unknown>) => unknown = descriptor.value

    const timeLabel = `${target.constructor.name}.${propertyKey}`
    descriptor.value = function (...args: Array<unknown>) {
      console.time(timeLabel)
      const value: unknown = original.apply(this, args)
      console.timeEnd(timeLabel)

      console.debug(timeLabel, JSON.stringify(args))

      return value
    }
  }
}
