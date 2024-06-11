export type HeadersConfgType = Record<string, string | number | boolean | null>;

export interface HeadersAndConfigs {
    httpHeaders: HeadersConfgType;
    proxyConfig: HeadersConfgType;
}
