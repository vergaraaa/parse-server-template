FROM node:19.9.0-alpine

WORKDIR /usr/src/app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

EXPOSE 1337

CMD ["pnpm", "run", "dev"]