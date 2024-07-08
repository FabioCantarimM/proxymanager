export namespace Response {
  interface Input<T = any> {
    success: boolean
    data: T
    headers: Record<string, string>
    status: number
    statusText: string
  }
  export function makeResponse<T>(validation: Input<T>): Response<T> {
    const { headers, status, statusText, success, data } = validation

    if (status >= 400) throw new Error(statusText)

    const contentType = headers['content-type']

    const bytes = +(headers['content-length'] || '0')
    return {
      success,
      data,
      contentType,
      status,
      statusText,
      bytes,
    }
  }
}

export interface Response<T = any> {
  success: boolean
  data: T
  contentType: string
  status: number
  statusText: string
  bytes: number
}
