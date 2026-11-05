import { getTaskPoolSize } from '../math/get-task-pool-size';
import { getReservedTaskKeys } from './get-reserved-task-keys';
import type { TrainingSession } from './training.types';

export function prepareTaskKeys(session: TrainingSession): Set<string> {
  const poolSize = getTaskPoolSize(
    session.settings.operations,
    session.settings.difficulty,
  );

  const reservedKeys = getReservedTaskKeys(session);

  if (reservedKeys.size >= poolSize) {
    throw new Error('Pula jest zbyt mała, aby uzupełnić kolejkę.');
  }

  if (session.usedTaskKeys.size >= poolSize) {
    return reservedKeys;
  } else {
    return new Set(session.usedTaskKeys);
  }
}
