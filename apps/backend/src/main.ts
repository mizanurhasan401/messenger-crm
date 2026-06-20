import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { toNodeHandler } from "better-auth/node";
import express from "express";
import { AppModule } from "./app.module";
import { AUTH, type Auth } from "./auth/better-auth.config";
import type { Env } from "./config/env.validation";

async function bootstrap(): Promise<void> {
  // bodyParser disabled so Better Auth's handler can read the raw request first.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(ConfigService) as ConfigService<Env, true>;

  app.setGlobalPrefix("api", { exclude: ["health"] });

  app.enableCors({
    origin: config.get("CORS_ORIGINS", { infer: true }).split(",").map((o) => o.trim()),
    credentials: true,
  });

  // Mount Better Auth BEFORE the JSON body parser, on the raw Express instance so
  // the full /api/auth/* path reaches the handler (app.use would strip the prefix).
  const auth = app.get<Auth>(AUTH);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all("/api/auth/*", toNodeHandler(auth));

  // JSON parsing for the rest of the API (registered after, so auth routes win).
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = config.get("PORT", { infer: true });
  await app.listen(port);
  new Logger("Bootstrap").log(`Backend listening on http://localhost:${port}`);
}

void bootstrap();
