# ui-workshop — Storybook static build for apps/workshop, served by nginx.
#
# Cluster nodes are linux/amd64; this repo is edited from an arm64 Mac, so the
# image is built in GitHub Actions (same reason as i258-net/honeycomb).
# Published as ghcr.io/i258-net/ui-workshop (not the repo name).

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json packages/ui/
COPY apps/workshop/package.json apps/workshop/
RUN pnpm install --frozen-lockfile
COPY . .
ENV STORYBOOK_DISABLE_TELEMETRY=1
# Vite aliases resolve @i258/ui to packages/ui/src; package build is still
# required so any non-aliased import path stays valid and matches CI.
RUN pnpm build && pnpm workshop:build

FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
COPY docker/workshop-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/workshop/storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
