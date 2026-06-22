# Messenger CRM & Order Management — SaaS Backend

A **production-ready, multi-tenant** Facebook Messenger CRM & Order Management
backend built as a **Modular Monolith** with NestJS (Fastify), Prisma, and
PostgreSQL — architected so any module can later be extracted into a
microservice with minimal change.

---

## Tech Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | NestJS 11 + **Fastify** adapter          |
| Language       | TypeScript 5                             |
| Database       | PostgreSQL 16                            |
| ORM            | Prisma 6 (UUID PKs, tenant indexes)      |
| Auth           | JWT access + **refresh rotation** (reuse detection), Argon2 |
| Cache / Queue  | Redis 7 (ioredis) + **BullMQ**           |
| Storage        | **Cloudflare R2** (S3-compatible, presigned URLs) |
| Validation     | class-validator / class-transformer      |
| Docs           | Swagger / OpenAPI                        |
| Logging        | Winston                                  |
| Testing        | Jest + Supertest                         |
| Tenant context | `nestjs-cls` (AsyncLocalStorage)         |
| DevOps         | Docker multi-stage + Docker Compose      |

---

## Architecture

**Clean Architecture, layered per module:**

```
Controller  → HTTP I/O only, no business logic, Swagger + RBAC decorators
Service     → business logic, orchestration, transactions
Repository  → Prisma data access, ALWAYS tenant-scoped (organization_id)
DTO         → validated, Swagger-documented request/response contracts
```

Cross-cutting concerns live in `common/` and `infra/`. Every feature module is
self-contained (`*.module.ts`, controller, service, repository, dto/) and only
talks to other modules through their exported providers — the seam along which
a module could later become a microservice.

### Multi-tenancy (data isolation)

1. `JwtAuthGuard` authenticates and attaches `request.user` (incl. `organizationId`).
2. `TenantGuard` hydrates the request's **CLS `TenantContext`** with the org id.
3. `BaseRepository` / repositories read `organizationId` from `TenantContext`
   and inject it into **every** Prisma `where` clause.
4. Unique constraints are compound on `(organization_id, …)` and hot columns are
   indexed by `organization_id`.

Result: a query can never accidentally cross tenants — isolation is structural,
not "remember to add a filter".

### RBAC

- Roles: `OWNER > ADMIN > MANAGER > AGENT` (see `common/enums/role.enum.ts`).
- Granular permissions (`customer.create`, `order.delete`, …) resolved from a
  role→permission matrix (`common/enums/permission.enum.ts`).
- Enforced globally by `RolesGuard` + `PermissionsGuard` via `@Roles()` /
  `@RequirePermissions()` decorators.

### Global request pipeline

```
Throttler → JwtAuth → Tenant → Roles → Permissions     (guards)
ValidationPipe (whitelist + transform)                  (pipe)
LoggingInterceptor → ResponseInterceptor                (interceptors)
AllExceptionsFilter                                     (filter)
```

Every success is wrapped as `{ success, message, data, meta? }`; every error as
`{ success:false, message, errors }`.

---

## Folder Structure

```
.
├── prisma/
│   ├── schema.prisma          # full data model (UUID PKs, tenant indexes)
│   └── seed.ts                # demo org + users + data
├── src/
│   ├── main.ts                # Fastify bootstrap, helmet/cors, Swagger
│   ├── app.module.ts          # global wiring (guards, interceptors, filter)
│   ├── config/                # configuration + env validation
│   ├── common/                # decorators, guards, interceptors, filters,
│   │   ├── decorators/        #   dtos, enums, context, base repository
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── context/           #   TenantContext (CLS-backed)
│   │   ├── repositories/      #   BaseRepository (tenant scoping)
│   │   ├── dto/  enums/  constants/
│   ├── infra/                 # framework-facing infrastructure (all @Global)
│   │   ├── prisma/  redis/  queue/  storage/  mail/  logger/
│   └── modules/               # feature modules (one folder each)
│       ├── auth/  user/  organization/
│       ├── customer/  tag/  note/  order/
│       ├── dashboard/  analytics/  subscription/
│       ├── notification/  audit-log/  file/  extension/  health/
├── test/                      # e2e (Supertest)
├── Dockerfile  docker-compose.yml  .env.example
```

---

## API Surface (prefix: `/api/v1`)

| Area         | Endpoints |
| ------------ | --------- |
| **Auth**     | `POST /auth/register · login · logout · refresh · forgot-password · reset-password · verify-email · change-password`, `GET /auth/me` |
| **Users**    | `GET /users`, `GET/PATCH /users/:id`, `PATCH /users/:id/role` |
| **Org**      | `GET/PATCH /organization` |
| **Customers**| `POST/GET /customers`, `GET/PATCH/DELETE /customers/:id`, `PATCH /customers/:id/status · /assign` |
| **Tags**     | `POST/GET /tags`, `PATCH/DELETE /tags/:id`, `POST /tags/:id/attach · /detach` |
| **Notes**    | `POST /notes`, `GET /notes/customer/:customerId`, `PATCH/DELETE /notes/:id` |
| **Orders**   | `POST/GET /orders`, `GET/PATCH/DELETE /orders/:id`, `PATCH /orders/:id/status` |
| **Dashboard**| `GET /dashboard/stats` |
| **Analytics**| `GET /analytics/sales · orders · customers` |
| **Subscription** | `GET/PATCH /subscription` |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read · /read-all` |
| **Audit**    | `GET /audit-logs` |
| **Files**    | `POST /files/presign · /confirm`, `GET /files/:id/download`, `DELETE /files/:id` |
| **Extension**| `POST /extension/customer-sync · /note · /order` |
| **Health**   | `GET /health` |

Full interactive docs at **`/docs`** (Swagger) when `SWAGGER_ENABLED=true`.

---

## Quick Start (local, with Docker for deps)

```bash
# 1. Configure
cp .env.example .env            # then edit secrets (JWT, R2, SMTP…)

# 2. Start Postgres + Redis
docker compose up -d postgres redis

# 3. Install & generate client
npm install
npm run prisma:generate

# 4. Migrate + seed
npm run prisma:migrate          # creates tables
npm run prisma:seed             # demo data → owner@acme.test / Password123!

# 5. Run
npm run start:dev               # http://localhost:3000/api/v1  ·  /docs
```

### Run everything in Docker

```bash
cp .env.example .env
docker compose up --build       # api + postgres + redis (migrations auto-run)
```

---

## Testing

```bash
npm test            # unit tests
npm run test:cov    # with coverage
npm run test:e2e    # e2e (needs Postgres + Redis running + migrated DB)
```

---

## Production Deployment Guide

1. **Provision** managed PostgreSQL 16 and Redis 7 (TLS recommended — set
   `REDIS_TLS=true`). Create the database and a least-privilege app user.
2. **Secrets**: set strong, unique `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
   (≥ 32 chars), R2 credentials, and SMTP credentials as environment variables
   / secret manager entries. Never commit `.env`.
3. **Build the image**: `docker build -t crm-api:latest .` (multi-stage; runs as
   non-root `nestjs` user, uses `tini` as PID 1 for clean signal handling).
4. **Migrate**: the container runs `prisma migrate deploy` on start. For
   zero-downtime, run migrations as a separate one-shot job before rolling out
   new app pods.
5. **Run** ≥ 2 replicas behind a load balancer. The app is stateless — sessions
   live in Postgres (refresh tokens) and Redis (blacklist/cache), so it scales
   horizontally. BullMQ workers run in-process; for heavy queues, run dedicated
   worker replicas (same image, a worker-only entrypoint).
6. **Health checks**: point the orchestrator's liveness/readiness probe at
   `GET /api/v1/health` (reports DB + Redis status).
7. **Observability**: Winston emits structured JSON in production — ship stdout
   to your log pipeline. Add APM/metrics as needed.
8. **Security**: Helmet, CORS allow-list (`CORS_ORIGINS`), per-route rate limits,
   Argon2id hashing, refresh-token rotation with reuse detection, and access-token
   revocation via Redis blacklist are all enabled by default.

### Scaling toward microservices

Each module exports a thin service interface and owns its tables. To extract one
(e.g. Analytics): replace its in-process imports with a transport (HTTP/gRPC/
message bus), move its Prisma models to a dedicated schema/DB, and deploy
independently — the module boundaries already enforce the separation.

---

## Environment Variables

See [`.env.example`](.env.example) — grouped by App, Database, Redis, JWT,
Security, Mail, Cloudflare R2, and Extension. `src/config/env.validation.ts`
validates required vars at boot and fails fast on misconfiguration.
