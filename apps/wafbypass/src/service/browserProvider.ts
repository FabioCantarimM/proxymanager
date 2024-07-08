import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

import fs from 'fs';
import path from 'path';

interface BrowserOptions {
    headless?: boolean;
    args?: string[];
    remoteUrl?: string | boolean;
    noProxy?: boolean
}

puppeteer.use(StealthPlugin())

//Gerenciar erros
//Retry
//Liberar request pelo browser
//Qunato tempo o browser pode ficar em memoria sem quebrar

export class BrowserController {
    private browser: Browser | null = null;
    private options: BrowserOptions | null = null;
    private password: string;
    private username: string;
    private proxyServer: string;

    private remoteUsername: string = process.env.DEFAULT_REMOTE_USERNAME || '';
    private remotePassword: string = process.env.DEFAULT_REMOTE_PASSWORD || '';
    private remoteServer: string =  process.env.DEFAULT_REMOTE_SERVER || 'brd.superproxy.io:9222';
    private remoteBrowser: string = `wss://${this.remoteUsername}:${this.remotePassword}@${this.remoteServer}`

    constructor(options: BrowserOptions = {}, credential?: {username: string, password: string, server: string}) {
        this.password = credential?.password || process.env.DEFAULT_UNLOCKER_PASSWORD || '';
        this.username = credential?.username || process.env.DEFAULT_UNLOCKER_USERNAME || '';
        this.proxyServer = credential?.server || process.env.DEFAULT_UNLOCKER_SERVER || 'brd.superproxy.io:22225'
        this.settingBrowserOptions(options)
    }

    public async launch() {
        if (this.options?.remoteUrl) {
            this.browser = await puppeteer.connect({ browserWSEndpoint: this.remoteBrowser = (typeof this.options.remoteUrl === 'string') 
                ? this.options.remoteUrl 
                : this.remoteBrowser})
                .catch((e: Error) => {
                    console.error(e.message)
                    return puppeteer.launch({
                        headless: this.options?.headless ?? true,
                        args: this.options?.args ?? [],
                        // executablePath: brwoserPath
                    });
                });
            return this.browser.newPage()
        } else {
            this.browser = await puppeteer.launch({
                headless: this.options?.headless ?? true,
                args: this.options?.args ?? [],
                // executablePath: brwoserPath
            });

            const page = await this.browser.newPage()
            const preloadFile = fs.readFileSync(path.resolve(__filename, '../scripts/pageConfig.js'), 'utf8')
            await page.evaluateOnNewDocument(preloadFile)
            await page.authenticate({username: this.username, password: this.password})
            return page
        }
    }

    private async settingBrowserOptions(options:  BrowserOptions){
        this.options =  {
            headless: !options.headless ? options.headless : true,
            args: [
                '--no-sandbox',
                '--no-first-run',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--memory-pressure-off',
                '--ignore-certificate-errors',
                '--disable-features=site-per-process',
                ... (options.args?.length ? options.args : [])
            ],
            remoteUrl: options.remoteUrl
        };

        if (!options.remoteUrl && !options.noProxy)
            this.options.args?.push(`--proxy-server=${this.proxyServer}`)
    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed successfully');
        }
    }
}
