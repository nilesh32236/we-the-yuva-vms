FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma/ ./prisma/
RUN npx --yes prisma@5.22.0 generate
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/prisma ./prisma
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate \
 && pnpm install --prod --frozen-lockfile \
 && npx --yes prisma@5.22.0 generate
EXPOSE 4000
USER nodeuser
CMD ["sh", "-c", "npx --yes prisma@5.22.0 db push --skip-generate && npx --yes tsx prisma/seed.ts && node dist/index.js"]
