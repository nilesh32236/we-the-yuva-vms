FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y redis-server --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/prisma ./prisma
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate \
 && pnpm install --prod --frozen-lockfile \
 && pnpm add -P tsx \
 && npx prisma generate
ENV REDIS_URL=redis://127.0.0.1:6379
ENV NODE_ENV=production
# TODO: remove seed from CMD for production - currently runs on every start
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1
CMD ["sh", "-c", "redis-server --daemonize yes && sleep 1 && npx prisma db push --accept-data-loss --skip-generate && npx tsx prisma/seed.ts && exec node dist/index.js"]
