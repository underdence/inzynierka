import type { Difficulty } from './math.types';
import { ADDITION_RANGES } from './math.config';

export function getAdditionPoolSize(difficulty: Difficulty): number {
  const range = ADDITION_RANGES[difficulty];
  const n = range.max - range.min + 1;

  return (n * (n + 1)) / 2;
}
