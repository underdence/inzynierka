import { generateTask } from './generate-task';
import type { Operation, Difficulty, MathTask } from './math.types';
import { randomInt } from './random-int';
import { getTaskKey } from './get-task-key';

export function generateTasks(
  operations: Operation[],
  difficulty: Difficulty,
  count: number,
): MathTask[] {
  const tasks: MathTask[] = [];
  if (operations.length === 0) {
    throw new Error('Wybierz przynajmniej jedno działanie.');
  }

  const allowedCounts = [10, 20, 30];
  if (!allowedCounts.includes(count)) {
    throw new Error('Liczba pytań musi wynosić 10, 20 lub 30.');
  }

  const uniqueOperations = [...new Set(operations)];
  const usedKeys = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 100;

  while (tasks.length < count) {
    if (attempts >= maxAttempts) {
      throw new Error('Nie udało się wygenerować serii bez powtórzeń.');
    }

    attempts++;

    const index = randomInt(0, uniqueOperations.length - 1);
    const operation = uniqueOperations[index];
    const task = generateTask(operation, difficulty);
    const key = getTaskKey(task);

    if (usedKeys.has(key)) {
      continue;
    }

    usedKeys.add(key);
    tasks.push(task);
  }

  return tasks;
}
