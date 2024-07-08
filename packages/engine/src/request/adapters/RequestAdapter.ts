import { Retryable } from '../../lib/Retryable'
import { Response } from '../../lib/response'

export abstract class RequestAdapter implements Retryable.Requester<Response<string>> {
  abstract getRequester(): Retryable.Requester<Response<string>>

  constructor(
    readonly uri: string,
    readonly proxy?: string,
    readonly maxRetries = 3,
  ) {}

  async execute(): Promise<Response<string>> {
    return Retryable.request(this.getRequester()).catch(err => err)
  }
}
