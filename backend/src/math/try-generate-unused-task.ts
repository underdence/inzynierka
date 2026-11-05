import { generateTask } from './generate-task';
import { getTaskKey } from './get-task-key';
import { randomInt } from './random-int';
import type { Operation, Difficulty, MathTask } from './math.types';

export function tryGenerateUnusedTask(
  operations: Operation[],
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask | undefined {
  const uniqueOperations = [...new Set(operations)];

  if (uniqueOperations.length === 0) {
    throw new Error('Wybierz przynajmniej jedno działanie.');
  }

  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const index = randomInt(0, uniqueOperations.length - 1);
    const operation = uniqueOperations[index];
    const task = generateTask(operation, difficulty);
    const key = getTaskKey(task);

    if (!blockedKeys.has(key)) {
      return task;
    }
  }

  return undefined;
}
