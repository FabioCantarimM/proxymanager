import axios from 'axios';
import * as cheerio from 'cheerio';
import * as http from 'http';
import * as https from 'https';

interface Item {
  Produto: string;
  Preço: string;
  URL?: string;
  Conteudo?: string;
}

const commonOptions: http.AgentOptions | https.AgentOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 10, // Adjust as needed
};

export const createAxiosAgent = (proxy?: string) => {
  if (proxy) {
    const [ip, port] = proxy.split(':');
    commonOptions.port = +port;
    commonOptions.host = ip;
  }

  return (protocol: 'http' | 'https') => {
    if (protocol === 'http') return new http.Agent(commonOptions);

    return new https.Agent({ ...commonOptions, rejectUnauthorized: false });
  };
};

export class MercadoLivreCrawler {
  private proxy = {
    protocol: 'http',
    host: 'localhost',
    port: 80,
  };

  async executeCommand(query: string, page: number = 1): Promise<Item[] | null> {
    const url = `http://lista.mercadolivre.com.br/${query.replace(' ', '-')}_Desde_${(page - 1) * 50}`;
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    };

    try {
      const response = await axios.get(url, {
        headers,
        proxy: this.proxy,
        httpsAgent: createAxiosAgent('localhost:80')('http'),
        httpAgent: createAxiosAgent('localhost:80')('http'),
      });
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        const results = $('div.ui-search-result');

        const data: Item[] = [];
        results.each((index, element) => {
          const title = $(element).find('h2.ui-search-item__title').text().trim();
          const price = $(element).find('span.andes-money-amount__fraction').text().trim();
          const link = $(element).find('a.ui-search-link').attr('href') || undefined;
          data.push({ Produto: title, Preço: price, URL: link });
        });
        return data;
      } else {
        console.log('Falha ao fazer a solicitação HTTP.');
        return null;
      }
    } catch (error) {
      console.error('Erro ao fazer a solicitação HTTP:', error);
      return null;
    }
  }

  async getAllData(query: string, totalPages: number): Promise<Item[] | null> {
    const allData: Item[] = [];
    for (let page = 1; page <= totalPages; page++) {
      const data = await this.executeCommand(query, page);
      if (data) {
        allData.push(...data);
      } else {
        console.log(`Erro ao obter dados da página ${page}.`);
      }
    }
    return allData;
  }

  async fetchContent(item: Item): Promise<Item> {
    if (item.URL) {
      try {
        const axiosConfig: any = {};
        const headers = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        };
        const response = await axios.get(item.URL, {
          headers,
          proxy: this.proxy,
          httpsAgent: createAxiosAgent('localhost:80')('http'),
          httpAgent: createAxiosAgent('localhost:80')('http'),
        });

        if (response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);
          const content = $('body').text();
          return { ...item, Conteudo: content };
        } else {
          console.log(`Falha ao acessar ${item.URL}.`);
          return item;
        }
      } catch (error) {
        console.error(`Erro ao acessar ${item.URL}:`, (error as Error).message);
        return item;
      }
    } else {
      console.log('URL inválida.');
      return item;
    }
  }

  async fetchAllContents(items: Item[]): Promise<Item[]> {
    const promises = items.map(item => this.fetchContent(item));
    const updatedItems = await Promise.all(promises);
    return updatedItems;
  }
}

// Exemplo de utilização
async function main() {
    const crawler = new MercadoLivreCrawler();
    const totalPages = 1; // Defina o número total de páginas a serem verificadas
    const data = await crawler.getAllData("iphone 12", totalPages);
    if (data !== null) {
        const itemsWithContent = await crawler.fetchAllContents(data);
    } else {
        console.log("Erro ao obter os dados.");
    }
}

main();