import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SessionService } from '../src/auth/session.service';
import { createHash, randomUUID } from 'node:crypto';

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let email: string;
  let nickname: string;

  const password = 'TestoweHaslo123!';
  const testEmails = new Set<string>();
  const guestTokenHashes = new Set<string>();

  function readSessionCookie(header: unknown, name: string): string {
    if (!Array.isArray(header)) {
      throw new Error('Brak nagłówka Set-Cookie.');
    }

    const value: unknown = header.find(
      (item: unknown) =>
        typeof item === 'string' && item.startsWith(`${name}=`),
    );

    if (typeof value !== 'string') {
      throw new Error(`Brak ciasteczka ${name}.`);
    }

    const cookie = value.split(';')[0];

    if (!cookie) {
      throw new Error('Puste ciasteczko.');
    }

    if (name === 'math_duel_guest') {
      const token = cookie.slice(name.length + 1);

      guestTokenHashes.add(createHash('sha256').update(token).digest('hex'));
    }

    return cookie;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, 'http://localhost:5173');

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    const suffix = randomUUID().replaceAll('-', '');

    email = `auth-test-${suffix}@example.com`;
    nickname = `Test_${suffix.slice(0, 12)}`;

    testEmails.add(email);
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.guestSession.deleteMany({
          where: {
            tokenHash: { in: [...guestTokenHashes] },
          },
        });
        await prisma.user.deleteMany({
          where: {
            email: { in: [...testEmails] },
          },
        });
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  it('registers, logs in and invalidates the session on logout', async () => {
    const server = app.getHttpServer();

    // 1. Bez sesji dostęp jest zabroniony.
    await request(server).get('/auth/me').expect(401);

    // 2. Tworzymy osobne konto dla tego testu.
    const registration = await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({ email, nickname, password })
      .expect(201);

    expect(registration.body).toEqual({
      id: expect.any(String),
      email,
      nickname,
      createdAt: expect.any(String),
    });

    // 3. Logujemy się i pobieramy ciasteczko.
    const login = await request(server)
      .post('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email, password })
      .expect(200);

    expect(login.body).toEqual({
      player: {
        type: 'user',
        id: expect.any(String),
        email,
        nickname,
      },
    });

    const setCookie: unknown = login.headers['set-cookie'];

    if (!Array.isArray(setCookie)) {
      throw new Error('Brak nagłówka Set-Cookie po logowaniu.');
    }

    const sessionCookie: unknown = setCookie.find(
      (value: unknown) =>
        typeof value === 'string' && value.startsWith('math_duel_session='),
    );

    if (typeof sessionCookie !== 'string') {
      throw new Error('Brak ciasteczka sesji po logowaniu.');
    }

    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');

    // Zachowujemy samą parę nazwa=wartość.
    const cookie = sessionCookie.split(';')[0];

    if (!cookie) {
      throw new Error('Puste ciasteczko sesji.');
    }

    // 4. Token pozwala pobrać dane konta.
    const me = await request(server)
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(me.body).toEqual(login.body);

    // 5. Wylogowujemy tę sesję.
    await request(server)
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', cookie)
      .expect(204);

    // 6. Celowo ponownie wysyłamy STARY token.
    await request(server).get('/auth/me').set('Cookie', cookie).expect(401);

    // 7. Powtórne wylogowanie też powinno się udać.
    await request(server)
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', cookie)
      .expect(204);
  });
  it('rejects an incorrect password without creating a session', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({ email, nickname, password })
      .expect(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    const response = await request(server)
      .post('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({
        email,
        password: 'NiepoprawneHaslo123!',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: ['Nieprawidłowy e-mail lub hasło.'],
    });

    expect(response.headers['set-cookie']).toBeUndefined();

    const sessionCount = await prisma.session.count({
      where: { userId: user.id },
    });

    expect(sessionCount).toBe(0);
  });

  it('rejects a nickname taken with different letter casing', async () => {
    const server = app.getHttpServer();
    const secondEmail = `second-${email}`;

    testEmails.add(secondEmail);

    await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({ email, nickname, password })
      .expect(201);

    await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({
        email: secondEmail,
        nickname: nickname.toUpperCase(),
        password,
      })
      .expect(409);

    const secondUser = await prisma.user.findUnique({
      where: { email: secondEmail },
    });

    expect(secondUser).toBeNull();
  });

  it('rejects an expired session', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({ email, nickname, password })
      .expect(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    const sessions = app.get(SessionService);
    const session = await sessions.create(user.id);

    const cookie = `math_duel_session=${session.token}`;

    await request(server).get('/auth/me').set('Cookie', cookie).expect(200);

    const tokenHash = createHash('sha256').update(session.token).digest('hex');

    await prisma.session.update({
      where: { tokenHash },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await request(server).get('/auth/me').set('Cookie', cookie).expect(401);
  });

  it('rejects registration from an untrusted origin', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', 'https://obca-strona.example')
      .send({ email, nickname, password })
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      message: ['Niedozwolone źródło żądania.'],
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    expect(user).toBeNull();
  });

  it('rejects registration from an untrusted origin', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .set('Origin', 'https://obca-strona.example')
      .send({ email, nickname, password })
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      message: ['Niedozwolone źródło żądania.'],
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    expect(user).toBeNull();
  });

  it('creates a guest and invalidates its token on logout', async () => {
    const server = app.getHttpServer();

    const guest = await request(server)
      .post('/auth/guest')
      .set('Origin', 'http://localhost:5173')
      .expect(201);

    const cookie = readSessionCookie(
      guest.headers['set-cookie'],
      'math_duel_guest',
    );

    expect(guest.body).toEqual({
      player: {
        type: 'guest',
        id: expect.any(String),
        nickname: expect.stringMatching(/^Gosc-[a-f0-9]{12}$/),
      },
    });

    const me = await request(server)
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(me.body).toEqual(guest.body);

    await request(server)
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', cookie)
      .expect(204);

    // Celowo ponownie przesyłamy stary token.
    await request(server).get('/auth/me').set('Cookie', cookie).expect(401);
  });

  it('prefers the account and revokes both sessions on logout', async () => {
    const server = app.getHttpServer();

    const guest = await request(server)
      .post('/auth/guest')
      .set('Origin', 'http://localhost:5173')
      .expect(201);

    const guestCookie = readSessionCookie(
      guest.headers['set-cookie'],
      'math_duel_guest',
    );

    await request(server)
      .post('/auth/register')
      .set('Origin', 'http://localhost:5173')
      .send({ email, nickname, password })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ email, password })
      .expect(200);

    const accountCookie = readSessionCookie(
      login.headers['set-cookie'],
      'math_duel_session',
    );

    const bothCookies = `${accountCookie}; ${guestCookie}`;

    const me = await request(server)
      .get('/auth/me')
      .set('Cookie', bothCookies)
      .expect(200);

    expect(me.body).toEqual({
      player: {
        type: 'user',
        id: expect.any(String),
        email,
        nickname,
      },
    });

    await request(server)
      .post('/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Cookie', bothCookies)
      .expect(204);

    // Sprawdzamy każdy stary token osobno.
    await request(server)
      .get('/auth/me')
      .set('Cookie', accountCookie)
      .expect(401);

    await request(server)
      .get('/auth/me')
      .set('Cookie', guestCookie)
      .expect(401);
  });
});
