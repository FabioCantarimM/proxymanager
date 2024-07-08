import { AxiosInstance } from 'axios'
import { Retryable } from '../lib/Retryable'
import { Response } from '../lib/response'

export class AxiosRequest implements Retryable.Requester<Response<string>> {
  constructor(
    readonly url: URL,
    readonly maxRetries: number,
    private readonly axiosClient: AxiosInstance,
  ) {}

  async execute() {
    const response = await this.axiosClient.get<string>(this.url.toString())
    const { data, status, statusText } = response
    const success = !!data && status < 400

    const headers = response.headers as Record<string, string>

    return Response.makeResponse({
      success,
      data,
      status,
      statusText,
      headers,
    })
  }
}
