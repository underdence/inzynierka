import { DIVISION_RANGES } from './math.config';
import type { Difficulty } from './math.types';

export function getDivisionPoolSize(difficulty: Difficulty): number {
  const ranges = DIVISION_RANGES[difficulty];

  const divisorCount = ranges.divisor.max - ranges.divisor.min + 1;
  const answerCount = ranges.answer.max - ranges.answer.min + 1;

  return divisorCount * answerCount;
}
