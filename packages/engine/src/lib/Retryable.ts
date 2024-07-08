export namespace Retryable {
  export interface Requester<T> {
    execute: () => Promise<T>
    maxRetries: number
  }

  export interface RetryOptions {
    maxRetries: number
    initialDelayMs: number
    maxDelayMs?: number
    backoffFactor?: number
    jitter?: boolean
  }

  export class RetryError extends Error {
    constructor(
      message: string,
      public readonly cause?: Error,
    ) {
      super(message)
    }
  }

  export async function request<T>(requester: Requester<T>, options?: Partial<RetryOptions>): Promise<T> {
    const defaultOptions: RetryOptions = {
      maxRetries: options?.maxRetries ?? 3,
      initialDelayMs: options?.initialDelayMs ?? 1000,
      backoffFactor: options?.backoffFactor ?? 2,
      jitter: options?.jitter ?? true,
    }

    const executor = new Executor(requester, defaultOptions)

    for await (const response of executor.execute()) {
      return response // Return immediately on success
    }

    // Unreachable in typical scenarios, but satisfies TypeScript
    throw new Error('Retry loop completed without result or error')
  }

  export class Executor<T> implements AsyncGenerator<T, any, unknown> {
    constructor(
      private readonly requester: Requester<T>,
      private readonly options: RetryOptions,
    ) {}

    private calculateDelay(attempt: number): number {
      const baseDelay = Math.min(
        this.options.initialDelayMs * Math.pow(this.options.backoffFactor ?? 2, attempt),
        this.options.maxDelayMs ?? Infinity,
      )

      if (this.options.jitter) return baseDelay + Math.random() * baseDelay

      return baseDelay
    }
    async *[Symbol.asyncIterator](): AsyncGenerator<T, any, unknown> {
      return this.execute()
    }

    // Implement required AsyncGenerator methods
    async next(...args: [] | [unknown]): Promise<IteratorResult<T, any>> {
      return this[Symbol.asyncIterator]().next(...args)
    }

    async return(value?: any): Promise<IteratorResult<T, any>> {
      return this[Symbol.asyncIterator]().return(value)
    }

    async throw(error?: any): Promise<IteratorResult<T, any>> {
      return this[Symbol.asyncIterator]().throw(error)
    }

    async *execute() {
      let attempt = 0

      while (attempt < this.options.maxRetries) {
        try {
          const result = await this.requester.execute()
          yield result
        } catch (error) {
          attempt++
          if (attempt < this.options.maxRetries) {
            const delayMs = this.calculateDelay(attempt)
            await new Promise(res => setTimeout(res, delayMs))
          }
          throw error // Rethrow on the last attempt
        }
      }
    }
  }
}
