import { Readable } from 'stream'
import { Retryable } from '../lib/Retryable'
import { Response } from '../lib/response'

export class FetchRequest implements Retryable.Requester<Response<string>> {
  constructor(
    readonly url: URL,
    readonly maxRetries: number,
    private readonly fetchOptions: RequestInit,
  ) {}

  async execute() {
    const response = await fetch(this.url.toString(), this.fetchOptions)

    return new Promise<Response<string>>((resolve, reject) => {
      const chunks: Buffer[] = []

      if (response?.body instanceof Readable) {
        const { body, status, statusText, headers } = response
        body.on('data', (chunk: Buffer) => chunks.push(chunk))
        body.on('end', () => {
          const content = Buffer.concat(chunks).toString()

          const success = !!content.length && status < 400

          const response = Response.makeResponse({
            success,
            data: content,
            status,
            statusText,
            headers: JSON.parse(JSON.stringify(headers)),
          })

          resolve(response)
        })
        body.on('error', reject)
      } else {
        reject(new Error('Response body is not a readable stream.'))
      }
    })
  }
}
