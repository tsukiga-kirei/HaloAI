# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9.3.0 --activate

COPY . .
RUN --mount=type=cache,id=haloai-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM workspace AS build

# Next 会在构建时把 rewrite 序列化进 standalone server；这里只能使用 Compose 内部服务名。
ARG INTERNAL_API_ORIGIN=http://api:3100
ENV INTERNAL_API_ORIGIN=$INTERNAL_API_ORIGIN
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

FROM build AS api-deploy
RUN --mount=type=cache,id=haloai-pnpm,target=/pnpm/store \
    pnpm --filter @haloai/api deploy --prod --prefer-offline /opt/haloai

FROM build AS worker-deploy
RUN --mount=type=cache,id=haloai-pnpm,target=/pnpm/store \
    pnpm --filter @haloai/worker deploy --prod --prefer-offline /opt/haloai

FROM build AS collab-deploy
RUN --mount=type=cache,id=haloai-pnpm,target=/pnpm/store \
    pnpm --filter @haloai/collab deploy --prod --prefer-offline /opt/haloai

FROM build AS migrate-deploy
RUN --mount=type=cache,id=haloai-pnpm,target=/pnpm/store \
    pnpm --filter @haloai/db deploy --prod --prefer-offline /opt/haloai

FROM node:22-alpine AS application-runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 后端产物已把 @haloai/* 内部包打包进去；pnpm deploy 只复制对应服务的生产依赖与构建产物。
USER node

FROM application-runtime AS api
COPY --from=api-deploy --chown=node:node /opt/haloai ./
EXPOSE 3100
CMD ["node", "dist/index.js"]

FROM application-runtime AS worker
COPY --from=worker-deploy --chown=node:node /opt/haloai ./
CMD ["node", "dist/index.js"]

FROM application-runtime AS collab
COPY --from=collab-deploy --chown=node:node /opt/haloai ./
EXPOSE 3200
CMD ["node", "dist/main.js"]

FROM application-runtime AS migrate
COPY --from=migrate-deploy --chown=node:node /opt/haloai ./
CMD ["node", "dist/migrate.js"]

FROM node:22-alpine AS web

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

# monorepo tracing root 让 standalone 保留 apps/web 层级；静态文件需要按 Next 官方部署契约单独复制。
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /workspace/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
