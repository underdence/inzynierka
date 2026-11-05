import { randomUUID } from 'node:crypto';
import { MULTIPLICATION_RANGES } from './math.config';
import { getTaskKey } from './get-task-key';
import type { Difficulty, MathTask } from './math.types';

export function findUnusedMultiplication(
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask | undefined {
  const ranges = MULTIPLICATION_RANGES[difficulty];

  for (let left = ranges.left.min; left <= ranges.left.max; left++) {
    for (let right = ranges.right.min; right <= ranges.right.max; right++) {
      const task: MathTask = {
        id: '',
        operation: 'multiplication',
        difficulty,
        left,
        right,
        answer: left * right,
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
