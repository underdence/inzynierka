import { randomUUID } from 'node:crypto';
import { ADDITION_RANGES } from './math.config';
import { getTaskKey } from './get-task-key';
import type { Difficulty, MathTask } from './math.types';

export function findUnusedAddition(
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask | undefined {
  const range = ADDITION_RANGES[difficulty];

  for (let left = range.min; left <= range.max; left++) {
    for (let right = left; right <= range.max; right++) {
      const task: MathTask = {
        id: '',
        operation: 'addition',
        difficulty,
        left,
        right,
        answer: left + right,
      };

      const key = getTaskKey(task);

      if (!blockedKeys.has(key)) {
        task.id = randomUUID();
        return task;
      }
    }
  }

  return undefined;
}
