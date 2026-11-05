import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';
import { MULTIPLICATION_RANGES } from './math.config';

export function generateMultiplication(difficulty: Difficulty): MathTask {
  const ranges = MULTIPLICATION_RANGES[difficulty];

  const left = randomInt(ranges.left.min, ranges.left.max);
  const right = randomInt(ranges.right.min, ranges.right.max);

  return {
    id: randomUUID(),
    operation: 'multiplication',
    difficulty,
    left,
    right,
    answer: left * right,
  };
}
