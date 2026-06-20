# Messenger CRM — Facebook Seller CRM + Messenger Extension SaaS

Production-oriented, multi-tenant SaaS for Facebook sellers: a **Next.js dashboard**, a **Chrome (Messenger) extension**, and a **standalone NestJS backend** in a Turborepo + pnpm monorepo.

Every business is an **Organization**; every tenant table carries `organizationId` and every query is org-scoped so data never crosses tenants.

## Architecture

```
apps/
  backend/     NestJS API (modules / services / repositories / guards / middleware)
  dashboard/   Next.js 15 App Router  (API client — cookie auth)
  extension/   Chrome MV3 + CRXJS     (API client — bearer auth via service worker)
packages/
  database/    Prisma schema + client + migrations + seed   (backend only)
  shared/      Zod schemas + types + enums + constants       (all apps)
  ui/          Shadcn/Tailwind components                    (dashboard + extension)
  config/      tsconfig / eslint / tailwind / prettier presets
docker/        Dockerfiles + Nginx
```

**Stack:** NestJS, Prisma, PostgreSQL, Redis + BullMQ, Better Auth · Next.js 15, TailwindCSS, TanStack Query/Table, React Hook Form, Zod, Recharts · CRXJS + React (MV3).

### Multi-tenant isolation
Two layers (see [apps/backend/src/prisma/tenant-prisma.service.ts](apps/backend/src/prisma/tenant-prisma.service.ts)):
1. A request-scoped **AsyncLocalStorage** tenant context seeded by the `Auth → Org → Roles` guard chain.
2. A Prisma `$extends` layer that auto-injects `organizationId` into every read/write. Repositories inject `TenantPrismaService`, never the raw client, so a query *cannot* forget its org filter.

### Auth
One Better Auth instance mounted in the backend at `/api/auth/*`. The dashboard uses the **cookie** flow; the extension uses the **bearer** flow with the token held only inside the background service worker.

## Prerequisites
- Node 20+, pnpm 9+, Docker (for Postgres + Redis)

## Quick start

```bash
cp .env.example .env                # fill BETTER_AUTH_SECRET etc.
pnpm install
docker compose up -d                # Postgres + Redis
pnpm db:generate                    # generate Prisma client
pnpm db:migrate                     # create schema
pnpm db:seed                        # demo org + sample data (optional)
pnpm dev                            # backend :4000  +  dashboard :3000
```

- Dashboard: http://localhost:3000 — register a business, you're in.
- Backend health: http://localhost:4000/health

### Chrome extension
```bash
pnpm --filter @messenger/extension build   # or `dev` for HMR
```
Load `apps/extension/dist` via `chrome://extensions` → *Load unpacked*. Sign in from the toolbar popup, then open a conversation on messenger.com — the CRM sidebar injects on the right. Add the extension id to `AUTH_TRUSTED_ORIGINS` / `CORS_ORIGINS` in `.env`.

## Testing
```bash
pnpm test                                   # unit (shared Zod/enums, extension detector)
pnpm --filter @messenger/backend test:e2e   # tenant-isolation + RBAC (needs Postgres)
```
The P1 gate test [apps/backend/test/e2e/tenant-isolation.e2e-spec.ts](apps/backend/test/e2e/tenant-isolation.e2e-spec.ts) proves org A cannot read org B's data.

## API surface (backend, all under `/api`)
`/auth/*` · `/organizations` · `/team` · `/customers` (+ `/import`, `/export`, `/:id/tags`) · `/orders` (+ `/:id/status`) · `/notes` · `/followups` · `/quick-replies` · `/analytics/*` · `/notifications` · `/audit-logs` · `/billing/*`

All (except `/health`, `/auth/*`, billing webhook) require auth; mutations are gated by `@Roles`. Send the active tenant via the `x-organization-id` header.

## Roles
Owner (full + billing) · Manager (CRM + team) · Agent (customers/orders/notes/followups) · Viewer (read-only).

## Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
Brings up Postgres, Redis, backend, dashboard, and Nginx (routes `/api`→backend, `/`→dashboard). CI runs lint/typecheck/test + e2e ([.github/workflows/ci.yml](.github/workflows/ci.yml)); the deploy workflow builds images and the extension artifact.

## Project status
All 8 roadmap phases are scaffolded and wired end-to-end. The backend implements every module; the dashboard covers auth + all module pages; the extension delivers the Messenger sidebar with bearer auth, FB detection, save-customer and `/shortcut` quick replies. Billing ships a provider-agnostic interface with a Stripe stub. Email delivery (verification/reset/invites) logs links in dev — wire SMTP for production.