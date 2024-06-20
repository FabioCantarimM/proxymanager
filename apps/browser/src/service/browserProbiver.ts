import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { setTimeout } from 'timers/promises';

interface BrowserOptions {
    headless?: boolean;
    args?: string[];
    remoteUrl?: string | boolean;
}

puppeteer.use(StealthPlugin())


class BrowserController {
    private browser: Browser | null = null;
    private options: BrowserOptions | null = null;
    private password: string = process.env.DEFAULT_UNLOCKER_PASSWORD || '';
    private username: string = process.env.DEFAULT_UNLOCKER_USERNAME || '';
    private proxyServer: string = process.env.DEFAULT_UNLOCKER_SERVER || 'brd.superproxy.io:22225';
    private remoteUsername: string = process.env.DEFAULT_REMOTE_USERNAME || '';
    private remotePassword: string = process.env.DEFAULT_REMOTE_PASSWORD || '';
    private remoteServer: string =  process.env.DEFAULT_REMOTE_SERVER || 'brd.superproxy.io:9222';
    private remoteBrowser: string = process.env.DEFAULT_REMOTE_BROWSER || `wss://${this.remoteUsername}:${this.remotePassword}@${this.remoteServer}`

    constructor(options: BrowserOptions = {}) {
        this.settingBrowserOptions(options)
    }

    public async launch() {
        if (this.options?.remoteUrl) {
            this.browser = await puppeteer.connect({ browserWSEndpoint: this.remoteBrowser = (typeof this.options.remoteUrl === 'string') 
                ? this.options.remoteUrl 
                : this.remoteBrowser});

            return this.browser.newPage()
        } else {
            this.browser = await puppeteer.launch({
                headless: this.options?.headless ?? true,
                args: this.options?.args ?? []
            });

            const page = await this.browser.newPage()
            await page.authenticate({username: this.username, password: this.password})
            return page
        }
    }

    private async settingBrowserOptions(options:  BrowserOptions){
        this.options =  {
            headless: !options.headless ? options.headless : true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--memory-pressure-off',
                '--ignore-certificate-errors',
                '--disable-features=site-per-process',
                ... (options.args?.length ? options.args : [])
            ],
        };

        if (!options.remoteUrl)
            this.options.args?.push(`--proxy-server=${this.proxyServer}`)

    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed successfully');
        }
    }
}

(async () => {

    const browserController = new BrowserController({headless: false});
    
    const page = await browserController.launch();
    if (page) {
        // await page.goto('https://bot.sannysoft.com');
        await page.goto('https://managingwp.io/2022/08/10/testing-and-reviewing-cloudflare-firewall-and-waf-rules/');
        await setTimeout(3000)
        // await page.screenshot({ path: 'testresult.png', fullPage: true })
        const cookies = await page.cookies()
        console.log(cookies)
        await page.close();
    }
    await browserController.close();
})();
