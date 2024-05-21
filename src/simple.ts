import * as http from 'http';

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  const p = getNewProxyAuth('brd-customer-hl_51a13a89-zone-smartproxy_dev_residential', 'br', '550', 'u72m129kbssk');

  const newHeader = { ...req.headers, 'Proxy-Authorization': p };
  req.headers = newHeader;

  const options: http.RequestOptions = {
    hostname: 'brd.superproxy.io',
    port: 22225,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, proxyRes => {
    console.log(req.headers);
    console.log(proxyRes.headers);

    const ip = proxyRes.headers['x-luminati-ip'] as string;

    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, {
      end: true,
    });
  });

  req.pipe(proxy, {
    end: true,
  });

  proxy.on('error', (err: Error) => {
    console.error(`Proxy error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  });
});

function getNewProxyAuth(user: string, country: string, session: string, password: string): string {
  const newAuth = `${user}-country-${country}-session-${session}-c_tag-${session}-debug-full-info:${password}`;
  // const newAuth = `${user}-country-${country}-session-${session}-c_tag-${session}:${password}`;
  const encodedAuth = Buffer.from(newAuth).toString('base64');
  return `Basic ${encodedAuth}`;
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  server.on('error', console.error);
});

/* 

    HTTPS
    VARIOS WORKS SUBINDO
    NGINX - Testar 
    
*/
