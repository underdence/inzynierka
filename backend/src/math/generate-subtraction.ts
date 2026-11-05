import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';
import { SUBTRACTION_RANGES } from './math.config';

export function generateSubtraction(difficulty: Difficulty): MathTask {
  const range = SUBTRACTION_RANGES[difficulty];

  let left = randomInt(range.min, range.max);
  let right = randomInt(range.min, range.max);

  if (!range.allowNegative && left < right) {
    const previousLeft = left;
    left = right;
    right = previousLeft;
  }

  return {
    id: randomUUID(),
    operation: 'subtraction',
    difficulty,
    left,
    right,
    answer: left - right,
  };
}
