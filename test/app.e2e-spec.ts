import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end smoke + auth flow.
 *
 * Requires a running PostgreSQL + Redis (see docker-compose) and a migrated
 * test database. Run with: `npm run test:e2e`.
 */
describe('App (e2e)', () => {
  let app: NestFastifyApplication;
  let http: ReturnType<typeof request>;
  let prefix: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const config = app.get(ConfigService);
    prefix = `/${config.get('apiPrefix')}/${config.get('apiVersion')}`;

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → ok', async () => {
    const res = await http.get(`${prefix}/health`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /customers without token → 401', async () => {
    await http.get(`${prefix}/customers`).expect(401);
  });

  it('POST /auth/register → creates org + returns tokens', async () => {
    const email = `e2e_${Date.now()}@test.dev`;
    const res = await http
      .post(`${prefix}/auth/register`)
      .send({
        email,
        password: 'Password123!',
        organizationName: `E2E Org ${Date.now()}`,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Authenticated request works with the returned access token.
    const token = res.body.data.tokens.accessToken;
    const me = await http
      .get(`${prefix}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.email).toBe(email);
  });
});
