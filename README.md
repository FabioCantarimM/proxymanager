# Proxy Manager

Jusbrasil Smart Proxy Manager

## Pre-Requisites

- Docker
- [NodeJS >= 20](https://nodejs.org/en) ([nvm](https://github.com/nvm-sh/nvm))

### Environment Variables

```bash
| name             | required | default          | description                        |
| ---------------- | -------- | ---------------- | ---------------------------------- |
| BROWSER_HOST     | true     | browserless:3000 | Host to connect on browserless     |
| BROWSER_TOKEN    | true     | none             | Token to connect to remote browser |
| BUCKET_HOST      | true     | localstack:4566  | Bucket host for uploads            |
| BRIGHTDATA_TOKEN | false    | none             | Token to connect to BrightData     |
| PROXY_USER       | false    | none             | Proxy username                     |
| PROXY_PASS       | false    | none             | Proxy password                     |
```

Set up an environment variable called `BROWSER_TOKEN`. Value must be any valid uuid string.

```bash
node -e "console.log(require('crypto').randomUUID())"

# or

python -c "import uuid; print(uuid.uuid4())"
```

### Certificates

```bash
# Generate a new private key
openssl genrsa -out certificate.key 2048

# Generate a new certificate signing request (CSR)
openssl req -new -key certificate.key -out certificate.csr

# Generate the certificate
openssl x509 -req -days 365 -in certificate.csr -signkey certificate.key -out certificate.pem

```

## Run

```bash
yarn build # build all at once
yarn build --production # build all at once for production
yarn docker:up -d # serve all containers at once

http://localhost:22999 # BrightData Proxy Manager
http://localhost:24000 # BrightData Proxy
http://localhost:8890 # Scrapoxy
http://localhost:8888 # Scrapoxy proxy
http://localhost:3000 # Browserless
http://localhost:6379 # Redis
http://localhost:4566 # Localstack
http://localhost:8080 # Back end
http://localhost:8081 # Back end (https)
http://localhost:9999 # Proxy
```
