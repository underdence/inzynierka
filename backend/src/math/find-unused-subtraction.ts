import { randomUUID } from 'node:crypto';
import { SUBTRACTION_RANGES } from './math.config';
import { getTaskKey } from './get-task-key';
import type { Difficulty, MathTask } from './math.types';

export function findUnusedSubtraction(
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask | undefined {
  const range = SUBTRACTION_RANGES[difficulty];

  for (let left = range.min; left <= range.max; left++) {
    for (let right = range.min; right <= range.max; right++) {
      if (!range.allowNegative && left < right) {
        continue;
      }

      const task: MathTask = {
        id: '',
        operation: 'subtraction',
        difficulty,
        left,
        right,
        answer: left - right,
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
