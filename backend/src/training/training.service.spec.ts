import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ConflictException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingSessionStore } from './training-session.store';
import { getReservedTaskKeys } from './get-reserved-task-keys';

describe('TrainingService', () => {
  let store: TrainingSessionStore;
  let service: TrainingService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-05T12:00:00Z'));

    store = new TrainingSessionStore();
    service = new TrainingService(store);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function startTraining() {
    const response = service.start('player-1', 'guest', {
      operations: ['addition'],
      difficulty: 'easy',
      durationSeconds: 30,
    });

    const session = store.findById(response.sessionId);

    if (session === undefined) {
      throw new Error('Test setup failed: session was not saved.');
    }

    return { response, session };
  }

  it('returns a question without revealing its answer', () => {
    const { response, session } = startTraining();

    expect(response.question.id).toBe(session.currentTask.id);
    expect(response.question).not.toHaveProperty('answer');
    expect(response).not.toHaveProperty('pendingTasks');
    expect(session.pendingTasks).toHaveLength(9);
  });

  it('keeps the question after a wrong answer and advances after a correct one', () => {
    const { response, session } = startTraining();
    const originalTask = session.currentTask;
    const nextTaskId = session.pendingTasks[0].id;

    const wrong = service.submitAnswer(
      response.sessionId,
      'player-1',
      'guest',
      {
        questionId: originalTask.id,
        answer: originalTask.answer + 1,
      },
    );

    expect(wrong.correct).toBe(false);
    expect(wrong.score).toBe(0);
    expect(wrong.attempts).toBe(1);
    expect(wrong.question.id).toBe(originalTask.id);

    const correct = service.submitAnswer(
      response.sessionId,
      'player-1',
      'guest',
      {
        questionId: originalTask.id,
        answer: originalTask.answer,
      },
    );

    expect(correct.correct).toBe(true);
    expect(correct.score).toBe(1);
    expect(correct.attempts).toBe(2);
    expect(correct.question.id).toBe(nextTaskId);
    expect(correct.question).not.toHaveProperty('answer');
    expect(session.pendingTasks).toHaveLength(9);
    expect(getReservedTaskKeys(session).size).toBe(10);
  });

  it('rejects a repeated answer without changing the counters', () => {
    const { response, session } = startTraining();
    const input = {
      questionId: session.currentTask.id,
      answer: session.currentTask.answer,
    };

    service.submitAnswer(response.sessionId, 'player-1', 'guest', input);

    expect(() =>
      service.submitAnswer(response.sessionId, 'player-1', 'guest', input),
    ).toThrow(ConflictException);

    expect(session.score).toBe(1);
    expect(session.attempts).toBe(1);
  });

  it('rejects access by a different player or player type', () => {
    const { response } = startTraining();

    expect(() =>
      service.getSummary(response.sessionId, 'player-2', 'guest'),
    ).toThrow(NotFoundException);

    expect(() =>
      service.getSummary(response.sessionId, 'player-1', 'user'),
    ).toThrow(NotFoundException);
  });

  it('rejects answers at the deadline but still returns the summary', () => {
    const { response, session } = startTraining();

    jest.setSystemTime(session.endsAt);

    expect(() =>
      service.submitAnswer(response.sessionId, 'player-1', 'guest', {
        questionId: session.currentTask.id,
        answer: session.currentTask.answer,
      }),
    ).toThrow(GoneException);

    expect(() =>
      service.getCurrentQuestion(response.sessionId, 'player-1', 'guest'),
    ).toThrow(GoneException);

    const summary = service.getSummary(response.sessionId, 'player-1', 'guest');

    expect(summary.finished).toBe(true);
    expect(summary.score).toBe(0);
    expect(summary.attempts).toBe(0);
  });

  it('renews an exhausted pool while protecting the current question and queue', () => {
    const response = service.start('player-1', 'guest', {
      operations: ['multiplication'],
      difficulty: 'easy',
      durationSeconds: 30,
    });

    const session = store.findById(response.sessionId);

    if (session === undefined) {
      throw new Error('Test setup failed: session was not saved.');
    }

    expect(session.usedTaskKeys.size).toBe(10);

    for (let i = 0; i < 45; i++) {
      const task = session.currentTask;

      service.submitAnswer(response.sessionId, 'player-1', 'guest', {
        questionId: task.id,
        answer: task.answer,
      });

      expect(session.usedTaskKeys.size).toBe(11 + i);
      expect(session.pendingTasks).toHaveLength(9);
      expect(getReservedTaskKeys(session).size).toBe(10);
    }

    expect(session.usedTaskKeys.size).toBe(55);
    expect(session.score).toBe(45);

    const reservedBeforeRenewal = getReservedTaskKeys(session);
    const task = session.currentTask;

    const result = service.submitAnswer(
      response.sessionId,
      'player-1',
      'guest',
      {
        questionId: task.id,
        answer: task.answer,
      },
    );

    expect(result.correct).toBe(true);
    expect(result.score).toBe(46);
    expect(result.attempts).toBe(46);

    expect(session.usedTaskKeys.size).toBe(11);

    for (const key of reservedBeforeRenewal) {
      expect(session.usedTaskKeys.has(key)).toBe(true);
    }

    expect(session.pendingTasks).toHaveLength(9);
    expect(getReservedTaskKeys(session).size).toBe(10);
  });
});
