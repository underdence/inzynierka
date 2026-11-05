import { createHash, randomUUID } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TrainingSessionStore } from '../src/training/training-session.store';
import type { StartTrainingResponse } from '../src/training/training.types';

describe('Training (e2e)', () => {
  const origin = 'http://localhost:5173';
  const guestTokenHashes = new Set<string>();

  const settings = {
    operations: ['addition'],
    difficulty: 'easy',
    durationSeconds: 120,
  };

  let app: INestApplication<App>;
  let prisma: PrismaService;
  let store: TrainingSessionStore;
  let ownerCookie: string;
  let otherCookie: string;

  async function createGuest(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/guest')
      .set('Origin', origin)
      .expect(201);

    const headers: unknown = response.headers['set-cookie'];

    if (!Array.isArray(headers)) {
      throw new Error('Missing Set-Cookie header.');
    }

    const header: unknown = headers.find(
      (value: unknown) =>
        typeof value === 'string' && value.startsWith('math_duel_guest='),
    );

    if (typeof header !== 'string') {
      throw new Error('Missing guest cookie.');
    }

    const cookie = header.split(';')[0];

    if (!cookie) {
      throw new Error('Empty guest cookie.');
    }

    const token = cookie.slice('math_duel_guest='.length);
    guestTokenHashes.add(createHash('sha256').update(token).digest('hex'));

    return cookie;
  }

  async function startTraining(): Promise<StartTrainingResponse> {
    const response = await request(app.getHttpServer())
      .post('/training')
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send(settings)
      .expect(201);

    expect(response.body).toEqual({
      sessionId: expect.any(String),
      question: {
        id: expect.any(String),
        operation: 'addition',
        difficulty: 'easy',
        left: expect.any(Number),
        right: expect.any(Number),
      },
      startedAt: expect.any(Number),
      endsAt: expect.any(Number),
      score: 0,
    });

    return response.body as StartTrainingResponse;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, origin);

    await app.init();

    prisma = app.get(PrismaService);
    store = app.get(TrainingSessionStore);

    ownerCookie = await createGuest();
    otherCookie = await createGuest();
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.guestSession.deleteMany({
          where: {
            tokenHash: { in: [...guestTokenHashes] },
          },
        });
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  it('requires authentication for every training endpoint', async () => {
    const server = app.getHttpServer();
    const id = randomUUID();

    await request(server)
      .post('/training')
      .set('Origin', origin)
      .send(settings)
      .expect(401);

    await request(server).get(`/training/${id}/question`).expect(401);

    await request(server).get(`/training/${id}/summary`).expect(401);

    await request(server)
      .post(`/training/${id}/answers`)
      .set('Origin', origin)
      .send({ questionId: randomUUID(), answer: 1 })
      .expect(401);
  });

  it('handles wrong, correct and repeated answers without leaking answers', async () => {
    const server = app.getHttpServer();
    const training = await startTraining();
    const baseUrl = `/training/${training.sessionId}`;
    const answer = training.question.left + training.question.right;

    expect(training.endsAt - training.startedAt).toBe(120_000);

    const current = await request(server)
      .get(`${baseUrl}/question`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(current.body).toEqual(training.question);

    const wrong = await request(server)
      .post(`${baseUrl}/answers`)
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send({
        questionId: training.question.id,
        answer: answer + 1,
      })
      .expect(200);

    expect(wrong.body).toEqual({
      correct: false,
      score: 0,
      attempts: 1,
      question: training.question,
    });

    const input = {
      questionId: training.question.id,
      answer,
    };

    const correct = await request(server)
      .post(`${baseUrl}/answers`)
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send(input)
      .expect(200);

    expect(correct.body).toEqual({
      correct: true,
      score: 1,
      attempts: 2,
      question: {
        id: expect.any(String),
        operation: 'addition',
        difficulty: 'easy',
        left: expect.any(Number),
        right: expect.any(Number),
      },
    });

    expect(correct.body.question.id).not.toBe(training.question.id);

    const repeated = await request(server)
      .post(`${baseUrl}/answers`)
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send(input)
      .expect(409);

    expect(repeated.body).toEqual({
      statusCode: 409,
      message: ['Odpowiedź dotyczy nieaktualnego zadania.'],
      path: `${baseUrl}/answers`,
      timestamp: expect.any(String),
    });

    const summary = await request(server)
      .get(`${baseUrl}/summary`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(summary.body).toEqual({
      sessionId: training.sessionId,
      score: 1,
      attempts: 2,
      startedAt: training.startedAt,
      endsAt: training.endsAt,
      finished: false,
    });
  });

  it('rejects access to another players training', async () => {
    const server = app.getHttpServer();
    const training = await startTraining();
    const baseUrl = `/training/${training.sessionId}`;

    for (const endpoint of ['question', 'summary']) {
      await request(server)
        .get(`${baseUrl}/${endpoint}`)
        .set('Cookie', otherCookie)
        .expect(404);
    }

    await request(server)
      .post(`${baseUrl}/answers`)
      .set('Origin', origin)
      .set('Cookie', otherCookie)
      .send({
        questionId: training.question.id,
        answer: training.question.left + training.question.right,
      })
      .expect(404);

    const summary = await request(server)
      .get(`${baseUrl}/summary`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(summary.body.score).toBe(0);
    expect(summary.body.attempts).toBe(0);
  });

  it('rejects expired training but keeps its summary available', async () => {
    const server = app.getHttpServer();
    const training = await startTraining();
    const session = store.findById(training.sessionId);

    if (session === undefined) {
      throw new Error('Training was not saved.');
    }

    session.endsAt = Date.now() - 1;

    const baseUrl = `/training/${training.sessionId}`;

    await request(server)
      .get(`${baseUrl}/question`)
      .set('Cookie', ownerCookie)
      .expect(410);

    await request(server)
      .post(`${baseUrl}/answers`)
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send({
        questionId: training.question.id,
        answer: training.question.left + training.question.right,
      })
      .expect(410);

    const summary = await request(server)
      .get(`${baseUrl}/summary`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(summary.body.finished).toBe(true);
    expect(summary.body.score).toBe(0);
    expect(summary.body.attempts).toBe(0);
  });

  it.each([
    { durationSeconds: 45 },
    { durationSeconds: '30' },
    { operations: [] },
    { operations: ['power'] },
    { operations: ['addition', 'addition'] },
    { difficulty: 'expert' },
    { playerId: 'another-player' },
  ])('rejects invalid training settings: %j', async (invalidFields) => {
    const response = await request(app.getHttpServer())
      .post('/training')
      .set('Origin', origin)
      .set('Cookie', ownerCookie)
      .send({ ...settings, ...invalidFields })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('rejects malformed answers without increasing attempts', async () => {
    const server = app.getHttpServer();
    const training = await startTraining();
    const baseUrl = `/training/${training.sessionId}`;
    const questionId = training.question.id;

    const invalidInputs = [
      { questionId, answer: '12' },
      { questionId, answer: 1.5 },
      { questionId },
      { questionId: 'invalid-id', answer: 12 },
      { questionId, answer: 12, score: 999 },
    ];

    for (const input of invalidInputs) {
      await request(server)
        .post(`${baseUrl}/answers`)
        .set('Origin', origin)
        .set('Cookie', ownerCookie)
        .send(input)
        .expect(400);
    }

    const summary = await request(server)
      .get(`${baseUrl}/summary`)
      .set('Cookie', ownerCookie)
      .expect(200);

    expect(summary.body.score).toBe(0);
    expect(summary.body.attempts).toBe(0);
  });

  it('rejects training creation from an untrusted origin', async () => {
    await request(app.getHttpServer())
      .post('/training')
      .set('Origin', 'https://obca-strona.example')
      .set('Cookie', ownerCookie)
      .send(settings)
      .expect(403);
  });
});
