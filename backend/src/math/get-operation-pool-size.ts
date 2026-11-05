import { getAdditionPoolSize } from './get-addition-pool-size';
import { getSubtractionPoolSize } from './get-subtraction-pool-size';
import { getMultiplicationPoolSize } from './get-multiplication-pool-size';
import { getDivisionPoolSize } from './get-division-pool-size';
import type { Operation, Difficulty } from './math.types';

export function getOperationPoolSize(
  operation: Operation,
  difficulty: Difficulty,
): number {
  if (operation === 'addition') {
    return getAdditionPoolSize(difficulty);
  } else if (operation === 'division') {
    return getDivisionPoolSize(difficulty);
  } else if (operation === 'multiplication') {
    return getMultiplicationPoolSize(difficulty);
  } else {
    return getSubtractionPoolSize(difficulty);
  }
}
