import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { createTrainingSession } from './create-training-session';
import { TrainingSessionStore } from './training-session.store';

describe('TrainingSessionStore', () => {
  let store: TrainingSessionStore;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-05T12:00:00Z'));

    store = new TrainingSessionStore();
  });

  afterEach(() => {
    store.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function createSession() {
    return createTrainingSession('test-player', 'guest', {
      operations: ['addition'],
      difficulty: 'easy',
      durationSeconds: 30,
    });
  }

  it('keeps sessions until the retention deadline and removes them at that deadline', () => {
    const session = createSession();
    store.save(session);

    const removalTime = session.endsAt + 10 * 60 * 1000;

    jest.setSystemTime(removalTime - 1);
    store.removeExpired();

    expect(store.findById(session.id)).toBe(session);

    jest.setSystemTime(removalTime);
    store.removeExpired();

    expect(store.findById(session.id)).toBeUndefined();
  });

  it('keeps active and recently finished sessions', () => {
    const active = createSession();
    const recent = createSession();
    recent.endsAt = Date.now() - 60_000;

    store.save(active);
    store.save(recent);
    store.removeExpired();

    expect(store.findById(active.id)).toBe(active);
    expect(store.findById(recent.id)).toBe(recent);
  });

  it('runs cleanup periodically and stops it on destruction', () => {
    const cleanup = jest.spyOn(store, 'removeExpired');

    store.onModuleInit();

    jest.advanceTimersByTime(59_999);
    expect(cleanup).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(cleanup).toHaveBeenCalledTimes(1);

    store.onModuleDestroy();

    jest.advanceTimersByTime(120_000);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
