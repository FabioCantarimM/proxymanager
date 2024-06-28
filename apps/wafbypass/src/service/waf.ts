import { BrowserController } from "./browserProvider";
import { setTimeout } from 'timers/promises';
import axios, { AxiosResponse } from 'axios';




export class WafBypass{

    private response: unknown

    constructor() {}

    public async getAcess(url: string, headers: object){
        const hasWaf = await this.checkIfContainsWaf(url,{})
        if (hasWaf){
            const browserController = new BrowserController({headless: false});
            const page = await browserController.launch();
            if (page) {
                await page.goto(url);
                await setTimeout(3000)
                await page.screenshot({ path: 'testresult.png', fullPage: true })
                const cookies = await page.cookies()
                await page.close();
                await browserController.close()
                return cookies
            }
        }
            return this.getCookies(this.response as AxiosResponse)
    }

    private async checkIfContainsWaf(url: string, headers: object){
       return axios.get(url)
            .then((response:AxiosResponse) => {
                const data = response.data;
                
                const cfRayHeader = response.headers['cf-ray'];
                const serverHeader = response.headers['server'];

                if (cfRayHeader || serverHeader && serverHeader.includes('cloudflare'))
                    return true
                
                this.response = response
                return false
            })
            .catch(error => {
                console.error('Houve um erro na requisição GET:', error);
                return true
            });
    }

    private getCookies(response: AxiosResponse){
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          return setCookieHeader
        } 

        return []
    }
}






(async () => {

    const byPass = new WafBypass()

    const cookies  = await byPass.getAcess('https://managingwp.io/2022/08/10/testing-and-reviewing-cloudflare-firewall-and-waf-rules/', {})

    console.log(cookies)

    return 

})();
