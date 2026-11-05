import { SUBTRACTION_RANGES } from './math.config';
import type { Difficulty } from './math.types';

export function getSubtractionPoolSize(difficulty: Difficulty): number {
  const range = SUBTRACTION_RANGES[difficulty];
  const n = range.max - range.min + 1;

  if (range.allowNegative) {
    return n * n;
  } else {
    return (n * (n + 1)) / 2;
  }
}
