import * as http from 'http'
import { HeadersAndConfigs, HeadersConfgType, ProxyConfig, ProxyType } from "../types";


const {SMARTPROXY_HEADER_PREFIX = 'smartproxy-'} = process.env;

export const paseHeadersConfigs = (requestHeaders: http.IncomingHttpHeaders) => {
    const httpHeaders: HeadersConfgType = {};
    const proxyConfig: ProxyConfig = {};

    const HEADER_PREFIX_SIZE = SMARTPROXY_HEADER_PREFIX.length;

    for (const key in requestHeaders) {
        if (Object.prototype.hasOwnProperty.call(requestHeaders, key)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.startsWith(SMARTPROXY_HEADER_PREFIX)) {
                let configName = lowerKey.substring(HEADER_PREFIX_SIZE);
                configName = configName.replace(/-/g, "_");
                proxyConfig[configName] = requestHeaders[key] as string;
            } else {
                httpHeaders[lowerKey] = requestHeaders[key] as string;
            }
        }
    }

    return { httpHeaders, proxyConfig };
}
