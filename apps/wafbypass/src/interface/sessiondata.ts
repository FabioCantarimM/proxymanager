export interface SessionData {
    cookies: { [key: string]: string };
    headers: { [key: string]: string };
    content: { [key: string]: string};
}