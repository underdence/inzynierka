import { randomUUID } from 'node:crypto';
import { DIVISION_RANGES } from './math.config';
import { getTaskKey } from './get-task-key';
import type { Difficulty, MathTask } from './math.types';

export function findUnusedDivision(
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask | undefined {
  const ranges = DIVISION_RANGES[difficulty];

  for (let right = ranges.divisor.min; right <= ranges.divisor.max; right++) {
    for (
      let answer = ranges.answer.min;
      answer <= ranges.answer.max;
      answer++
    ) {
      const left = right * answer;

      const task: MathTask = {
        id: '',
        operation: 'division',
        difficulty,
        left,
        right,
        answer,
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
