export enum ProxyType {
    BrightData_Residential = "brightdata_residential",
    BrightData_Unlocker = "brightdata_unlocker",
    No_Proxy = "no_proxy",
}


export interface ProxyConfig {
    proxy_username?: string;
    proxy_password?: string;
    proxy_zone?: string;
    proxy_country?: string;
    requester_group?: string;
    requester_id?: string;
    requester_links?: string[];
    session_id?: string;
    session_ip?: string;
    provider?: string;
    proxy_type?: ProxyType;
    http_client?: string;
    [key: string]: unknown;
}

export interface ProxyRequest {
    method: string;
    url: {
        scheme: string;
        host: string;
        path: string;
        query: string;
    };
    headers: { [key: string]: string };
}

export interface ProxyResponse {
    status_code: number;
    headers: { [key: string]: string };
}

/*
Configuration settings for a proxy connection.

Attributes:
    requester_group (str): Requester group. Usually the name of the project.
    requester_id (str): Unique identifier for the requester (ie: crawler id).
    requester_links (list[ProxyRequesterLink]): list of links to additional request metadata.
    session_id (str): Unique identifier for the session.
    session_ip (Optional[str]): IP address in use by the proxy session, same seen by the target host.
    host_ip (Optional[str]): The IP address of smartproxy instance.
    provider (str): Provider of the proxy service.
    proxy_zone(str): Name of the proxy provider zone to be used
    proxy_country(str): Country code of the exit IP address
    proxy_type (ProxyType): Type of the proxy from the ProxyType enum.
    timeout (int): Timeout for the proxy connection in seconds. Default is 10.
    retry_count (int): Number of retries for a failed connection. Default is 0.
    ssl_verification (Optional[bool]): Flag to determine if SSL certificates should be verified. Defaults to True.
    debug (Optional[bool]): Enable debug mode. Defaults to False.
*/

export interface ProxyRequestEvent {
    event_id: string;
    elapsed_seconds: number;
    succeeded: boolean;
    error_type?: string | null;
    error_message?: string | null;
    requester_group: string;
    requester_id: string;
    requester_links: string[];
    session_id: string;
    session_ip: string;
    provider: string;
    proxy_type: ProxyType;
    http_client: string;
    request_method: string;
    request_url: string;
    request_scheme: string;
    request_host: string;
    request_path: string;
    request_query: string;
    request_content_type?: string;
    request_content_bytes: number;
    request_user_agent?: string;
    request_referer?: string;
    response_status: number;
    response_content_type?: string;
    response_content_bytes: number;
}