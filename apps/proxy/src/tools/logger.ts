import * as http from 'http'
import { ProxyConfig, ProxyRequest, ProxyRequestEvent, ProxyResponse, ProxyType } from '../types';

const DEFAULT_PROXY_PROVIDER = 'default_provider';
const DEFAULT_PROXY_TYPE = { value: 'default_type' };
const DEFAULT_HTTP_CLIENT = 'default_client';

export const buildRequestEvent= (
    event_id: string,
    elapsed_seconds: number,
    proxy_config: ProxyConfig,
    request: http.IncomingMessage,
    resp?: http.IncomingMessage,
    error?: Error
): ProxyRequestEvent => {
return {
        event_id: event_id.toString(),
        elapsed_seconds: elapsed_seconds,
        succeeded: error ? false : true,
        error_type: error ? error.name : null,
        error_message: error ? error.message : null,
        requester_group: proxy_config.requester_group || '',
        requester_id: proxy_config.requester_id || '',
        requester_links: proxy_config.requester_links || [''],
        session_id: proxy_config.session_id || '',
        session_ip: proxy_config.session_ip || '',
        provider: proxy_config.provider || DEFAULT_PROXY_PROVIDER,
        proxy_type: proxy_config.proxy_type || DEFAULT_PROXY_TYPE.value as ProxyType,
        http_client: proxy_config.http_client || DEFAULT_HTTP_CLIENT,
        request_method: request.method || '',
        request_url: request.url || '',
        request_scheme: new URL(request.url || '').protocol || '',
        request_host: new URL(request.url || '').hostname || '',
        request_path: new URL(request.url || '').pathname || '',
        request_query: new URL(request.url || '').search || '',
        request_content_type: request.headers['accept'],
        request_content_bytes: parseInt(request.headers['content-length'] || '0', 10),
        request_user_agent: request.headers['user-agent'],
        request_referer: request.headers['referer'],
        response_status: resp?.statusCode || 0,
        response_content_type: resp?.headers['content-type'],
        response_content_bytes: parseInt(resp?.headers['content-length'] as string || '0', 10) || 0,
    };
}


export const sendLog = (event: ProxyRequestEvent): void => {
    console.log(event)
}
