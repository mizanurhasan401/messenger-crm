# =====================================================================
# Multi-stage build — small, production-ready image
# =====================================================================

# ---- Stage 1: dependencies ------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Stage 2: build -------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Prune dev dependencies for the runtime image
RUN npm prune --omit=dev

# ---- Stage 3: runtime ----------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl tini && \
    addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

USER nestjs
EXPOSE 3000

# tini = proper PID 1 / signal handling for graceful shutdown
ENTRYPOINT ["/sbin/tini", "--"]
# Run pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
