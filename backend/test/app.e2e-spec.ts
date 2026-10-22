import { Test } from '@nestjs/testing';
import { Body, Controller, HttpCode, Post, Get } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { IsEmail } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service.js';

class TestEmailDto {
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  email!: string;
}

@Controller('__test/validation')
class ValidationTestController {
  @Get('failure')
  fail(): never {
    throw new Error('TEST_INTERNAL_ERROR_DETAILS');
  }
  @Post()
  @HttpCode(200)
  validate(@Body() dto: TestEmailDto) {
    return { email: dto.email };
  }
}

describe('Backend (e2e)', () => {
  it('hides internal error details from the client', async () => {
    const response = await request(app.getHttpServer())
      .get('/__test/validation/failure')
      .expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      message: ['Wewnętrzny błąd serwera.'],
      path: '/__test/validation/failure',
      timestamp: expect.any(String),
    });

    expect(response.text).not.toContain('TEST_INTERNAL_ERROR_DETAILS');
  });
  let app: INestApplication<App>;
  const frontendOrigin = 'http://localhost:5173';

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ValidationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app, frontendOrigin);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / returns the welcome message', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Test!');
  });

  it('should query users from the database', async () => {
    const prisma = app.get(PrismaService);
    const usersCount = await prisma.user.count();

    expect(usersCount).toBeGreaterThanOrEqual(0);
  });

  it('GET /health returns status ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('returns the common error format for an unknown route', async () => {
    const response = await request(app.getHttpServer())
      .get('/nie-istnieje')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: ['Cannot GET /nie-istnieje'],
      path: '/nie-istnieje',
      timestamp: expect.any(String),
    });
  });

  it('accepts a valid email', () => {
    return request(app.getHttpServer())
      .post('/__test/validation')
      .send({ email: 'tester@example.com' })
      .expect(200)
      .expect({ email: 'tester@example.com' });
  });

  it('rejects an invalid email using the common error format', async () => {
    const response = await request(app.getHttpServer())
      .post('/__test/validation')
      .send({ email: 'to-nie-jest-email' })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['Podaj poprawny adres e-mail.'],
      path: '/__test/validation',
      timestamp: expect.any(String),
    });
  });

  it('rejects fields not declared in the DTO', async () => {
    const response = await request(app.getHttpServer())
      .post('/__test/validation')
      .send({
        email: 'tester@example.com',
        isAdmin: true,
      })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: ['property isAdmin should not exist'],
      path: '/__test/validation',
      timestamp: expect.any(String),
    });
  });

  it('returns the configured CORS origin', () => {
    return request(app.getHttpServer())
      .get('/health')
      .set('Origin', frontendOrigin)
      .expect('Access-Control-Allow-Origin', frontendOrigin)
      .expect(200);
  });
});
