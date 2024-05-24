import axios from 'axios'
import * as cheerio from 'cheerio'
import * as http from 'http'
import * as https from 'https'

interface Item {
  title: string
  price: string
  url?: string
  contentLength?: number
}

function removeURLParameters(url: string): string {
  const parsedUrl = new URL(url)
  return `${parsedUrl.origin}${parsedUrl.pathname}`
}

const commonOptions: http.AgentOptions | https.AgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10,
  rejectUnauthorized: false,
  requestCert: false,
}

export const createAxiosAgent = (proxy?: string) => {
  if (proxy) {
    const [ip, port] = proxy.split(':')
    commonOptions.port = +port
    commonOptions.host = ip
  }

  return (protocol: 'http' | 'https') => {
    if (protocol === 'http') return new http.Agent(commonOptions)

    return new https.Agent(commonOptions)
  }
}

const { PROXY_HOST = `https://proxy:80` } = process.env
const proxyURL = new URL(PROXY_HOST)

const proxy = {
  protocol: proxyURL.protocol.substring(0, proxyURL.protocol.length - 1),
  host: proxyURL.hostname,
  port: +proxyURL.port,
}
const agent = createAxiosAgent(`${proxy.host}:${proxy.port}`)

export class MercadoLivreCrawler {
  async executeCommand(query: string, page: number = 1): Promise<Item[] | null> {
    const url = `http://lista.mercadolivre.com.br/${query.replace(' ', '-')}_Desde_${(page - 1) * 50}`
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    }

    try {
      const response = await axios.get(url, {
        headers,
        proxy,
        httpsAgent: agent('https'),
        httpAgent: agent('http'),
      })

      if (response.status === 200) {
        const html = response.data
        const $ = cheerio.load(html)
        const results = $('div.ui-search-result')

        const data: Item[] = []
        results.each((index, element) => {
          const title = $(element).find('h2.ui-search-item__title').text().trim()
          const price = $(element).find('span.andes-money-amount__fraction').text().trim()
          const link = $(element).find('a.ui-search-link').attr('href') || undefined
          if (link) {
            const url = removeURLParameters(link)
            data.push({ title, price, url })
          }
        })
        return data
      } else {
        console.log('Falha ao fazer a solicitação HTTP.')
        return null
      }
    } catch (error) {
      console.error('Erro ao fazer a solicitação HTTP:')
      return null
    }
  }

  async getAllData(query: string, totalPages: number): Promise<Item[] | null> {
    const allData: Item[] = []
    for (let page = 1; page <= totalPages; page++) {
      const data = await this.executeCommand(query, page)
      if (data) {
        const items = await Promise.all(data.map(item => this.fetchContent(item)))
        allData.push(...items)
      } else {
        console.log(`Erro ao obter dados da página ${page}.`)
      }
    }
    return allData
  }

  async fetchContent(item: Item): Promise<Item> {
    if (item.url) {
      try {
        const response = await axios.get(item.url, {
          proxy,
          httpsAgent: agent('https'),
          httpAgent: agent('http'),
        })

        if (response.status === 200) {
          const html = response.data
          const $ = cheerio.load(html)

          const content = $('body').text()

          const buffer = Buffer.from(content)
          return { ...item, contentLength: buffer.byteLength }
        }
        return item
      } catch (error) {
        console.error((error as Error).message)
        return item
      }
    } else {
      console.log('URL inválida.')
      return item
    }
  }

  async fetchAllContents(items: Item[]): Promise<Item[]> {
    const updatedItems: Item[] = []
    for (const item of items) {
      const updatedItem = await this.fetchContent(item)
      updatedItems.push(updatedItem)
    }
    return updatedItems
  }
}
