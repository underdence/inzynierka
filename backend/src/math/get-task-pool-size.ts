import { getOperationPoolSize } from './get-operation-pool-size';
import type { Operation, Difficulty } from './math.types';

export function getTaskPoolSize(
  operations: Operation[],
  difficulty: Difficulty,
): number {
  const uniqueOperations = new Set(operations);
  let total = 0;

  for (const operation of uniqueOperations) {
    total += getOperationPoolSize(operation, difficulty);
  }

  return total;
}
