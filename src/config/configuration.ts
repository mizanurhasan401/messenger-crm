export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appName: process.env.APP_NAME ?? 'Messenger CRM SaaS',
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? 'v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*').split(',').map((o) => o.trim()),

  swagger: {
    enabled: (process.env.SWAGGER_ENABLED ?? 'true') === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    tls: (process.env.REDIS_TLS ?? 'false') === 'true',
    cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS ?? '60', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    issuer: process.env.JWT_ISSUER ?? 'messenger-crm',
    audience: process.env.JWT_AUDIENCE ?? 'messenger-crm-clients',
  },

  argon: {
    memoryCost: parseInt(process.env.ARGON_MEMORY_COST ?? '19456', 10),
    timeCost: parseInt(process.env.ARGON_TIME_COST ?? '2', 10),
    parallelism: parseInt(process.env.ARGON_PARALLELISM ?? '1', 10),
  },

  throttle: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_MAX ?? '10', 10),
  },

  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM ?? 'CRM <no-reply@crm.app>',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET ?? 'crm-uploads',
    publicUrl: process.env.R2_PUBLIC_URL,
    endpoint: process.env.R2_ENDPOINT,
    signedUrlTtl: parseInt(process.env.R2_SIGNED_URL_TTL ?? '900', 10),
  },

  extension: {
    apiKeyHeader: process.env.EXTENSION_API_KEY_HEADER ?? 'x-extension-key',
  },
});
