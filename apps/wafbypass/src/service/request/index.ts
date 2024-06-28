import { AxiosRequest } from './tools/axios';
import { FetchRequest } from './tools/fetch';
import { HttpsRequest } from './tools/https';
import { CurlRequest } from './tools/curl';

export const requestTools = {
  axios: 'axios',
  https: 'https',
  fetch: 'fetch',
  curl: 'curl',
};

export {
  AxiosRequest,
  FetchRequest,
  HttpsRequest,
  CurlRequest,
};
