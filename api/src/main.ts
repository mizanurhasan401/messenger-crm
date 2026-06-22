import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import { AppModule } from './app.module';
import { WinstonLogger } from './infra/logger/winston.logger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 5 * 1024 * 1024 }),
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  app.useLogger(new WinstonLogger(config.get<string>('appName')));

  // ---- Security ------------------------------------------------------
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(cors, {
    origin: config.get<string[]>('corsOrigins'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ---- Global pipes --------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- Routing -------------------------------------------------------
  const apiPrefix = config.get<string>('apiPrefix') ?? 'api';
  const apiVersion = config.get<string>('apiVersion') ?? 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // ---- Swagger / OpenAPI --------------------------------------------
  if (config.get<boolean>('swagger.enabled')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Messenger CRM & Order Management API')
      .setDescription(
        'Multi-tenant Facebook Messenger CRM SaaS — Modular Monolith (NestJS + Fastify + Prisma).',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(config.get<string>('swagger.path') ?? 'docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  const port = config.get<number>('port') ?? 3000;
  await app.listen({ port, host: '0.0.0.0' });

  const url = await app.getUrl();
  // eslint-disable-next-line no-console
  console.log(`🚀 API ready at ${url}/${apiPrefix}/${apiVersion}`);
  if (config.get<boolean>('swagger.enabled')) {
    // eslint-disable-next-line no-console
    console.log(`📚 Swagger docs at ${url}/${config.get<string>('swagger.path')}`);
  }
}

void bootstrap();
