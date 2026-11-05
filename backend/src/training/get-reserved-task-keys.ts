import { getTaskKey } from '../math/get-task-key';
import type { TrainingSession } from './training.types';

export function getReservedTaskKeys(session: TrainingSession): Set<string> {
  const tasks = [session.currentTask, ...session.pendingTasks];

  return new Set(tasks.map((task) => getTaskKey(task)));
}
