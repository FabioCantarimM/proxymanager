import axios, { AxiosResponse } from 'axios'

export class LuminatiProxyManager {
  constructor(private baseUrl: string) {}

  async getLogs() {
    const response: AxiosResponse = await axios.get(`${this.baseUrl}/api/logs?limit=1&status_code=200`)
    return response.data
  }
}
