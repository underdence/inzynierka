import { MULTIPLICATION_RANGES } from './math.config';
import type { Difficulty } from './math.types';

export function getMultiplicationPoolSize(difficulty: Difficulty): number {
  const ranges = MULTIPLICATION_RANGES[difficulty];

  const leftCount = ranges.left.max - ranges.left.min + 1;
  const rightCount = ranges.right.max - ranges.right.min + 1;

  const overlapMin = Math.max(ranges.left.min, ranges.right.min);
  const overlapMax = Math.min(ranges.left.max, ranges.right.max);
  const overlapCount = Math.max(0, overlapMax - overlapMin + 1);

  const duplicates = (overlapCount * (overlapCount - 1)) / 2;

  return leftCount * rightCount - duplicates;
}
