ARG NODE_ENV ${NODE_ENV:-development}
ARG APP
FROM node:20.11.1 as setup
ENV PATH="${PATH}:./node_modules/.bin"
ENV NODE_ENV ${NODE_ENV}
ENV APP ${APP}

WORKDIR /usr/src/app
EXPOSE 80
EXPOSE 9229
EXPOSE 4200

FROM setup as serve
ARG APP
CMD ["nx", "serve", "$APP"]
