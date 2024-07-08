# https://github.com/abhinavsingh/proxy.py
# FROM abhinavsingh/proxy.py:latest as base
FROM docker.io/library/python:3.12.0-slim AS base
RUN apt-get -y update
RUN apt-get -y install git make
RUN pip install "httpx[http2]"

WORKDIR /app

RUN git clone https://github.com/abhinavsingh/proxy.py.git .

RUN python3 -m venv venv
SHELL ["/bin/bash", "-c"] 
RUN source venv/bin/activate

RUN make lib-dep

RUN ./write-scm-version.sh

# RUN make ca-certificates
# RUN make sign-https-certificates

# https://proxypy.readthedocs.io/en/latest/#http-proxy-plugins
# RUN make dashboard
# RUN make devtools

ENTRYPOINT [ "python", "-m", "proxy" ]
