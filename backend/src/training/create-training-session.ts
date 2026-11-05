import { randomUUID } from 'node:crypto';
import { generateTasks } from '../math/generate-tasks';
import { getTaskKey } from '../math/get-task-key';
import type { TrainingSession, TrainingSettings } from './training.types';

export function createTrainingSession(
  playerId: string,
  playerType: 'user' | 'guest',
  settings: TrainingSettings,
): TrainingSession {
  const tasks = generateTasks(settings.operations, settings.difficulty, 10);

  const currentTask = tasks[0];
  const pendingTasks = tasks.slice(1);

  const usedTaskKeys = new Set(tasks.map((task) => getTaskKey(task)));

  const startedAt = Date.now();
  const endsAt = startedAt + settings.durationSeconds * 1000;

  return {
    id: randomUUID(),
    playerId,
    playerType,
    settings,
    startedAt,
    endsAt,
    score: 0,
    attempts: 0,
    currentTask,
    pendingTasks,
    usedTaskKeys,
  };
}
