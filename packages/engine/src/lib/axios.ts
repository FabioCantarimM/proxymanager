import axios, { CreateAxiosDefaults } from 'axios'
import rateLimitter, { rateLimitOptions } from 'axios-rate-limit'
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry'

export const createAxiosInstance = <T = any>({
  axiosOptions,
  rateLimitOptions,
  axiosRetryConfig,
}: {
  axiosOptions: CreateAxiosDefaults<T>
  rateLimitOptions: rateLimitOptions
  axiosRetryConfig?: IAxiosRetryConfig
}) => {
  const { requestInterceptorId, responseInterceptorId } = axiosRetry(axios, axiosRetryConfig)

  const axiosInstance = axios.create({
    ...axiosOptions,
    'axios-retry': {
      onRetry(retryCount, error, requestConfig) {
        console.debug({ retryCount, requestInterceptorId, responseInterceptorId, error, requestConfig })
      },
      ...axiosRetryConfig,
    },
  })

  axiosInstance.interceptors.request.use(
    config => {
      console.log('Request:', config.url)

      return config
    },
    error => {
      console.error(error.message, { requestInterceptorId, responseInterceptorId })
      return Promise.reject(error)
    },
  )
  axiosInstance.interceptors.response.use(
    response => {
      console.log('Response:', response.status)

      return response
    },
    error => {
      console.error(error.message, { requestInterceptorId, responseInterceptorId })
      return Promise.reject(error)
    },
  )

  return rateLimitter(axiosInstance, rateLimitOptions)
}
