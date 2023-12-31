FROM oven/bun:latest
WORKDIR /usr/src/app

ARG DISCORD_TOKEN=${THRESHOLD}
ENV DISCORD_TOKEN=${THRESHOLD}

ARG ENABLED=${ENABLED}
ENV ENABLED=${ENABLED}

ARG DATABASE_URL=${DATABASE_URL}
ENV DATABASE_URL=${DATABASE_URL}

ARG REDIS_URL=${REDIS_URL}
ENV REDIS_URL=${REDIS_URL}

RUN apt-get -y update; apt-get -y install curl
ARG NODE_VERSION=18
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n
	
COPY bun.lockb package.json prisma ./
RUN bun install

COPY . .
RUN bunx prisma generate

ENV NODE_ENV production

EXPOSE 3000
ENTRYPOINT [ "bun", "dev" ]