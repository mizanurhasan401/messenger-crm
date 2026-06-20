# Multi-stage build for the NestJS backend using pnpm + Turborepo prune.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- Prune the workspace to just the backend + its deps ----
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@^2 prune @messenger/backend --docker

# ---- Install deps + build ----
FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @messenger/database generate

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app .
WORKDIR /app
EXPOSE 4000
# Apply migrations then start the API (tsx transpiles the TS workspace deps).
CMD ["sh", "-c", "pnpm --filter @messenger/database migrate:deploy && pnpm --filter @messenger/backend start"]
