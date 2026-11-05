import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';
import { ADDITION_RANGES } from './math.config';

export function generateAddition(difficulty: Difficulty): MathTask {
  const range = ADDITION_RANGES[difficulty];

  const left = randomInt(range.min, range.max);
  const right = randomInt(range.min, range.max);

  return {
    id: randomUUID(),
    operation: 'addition',
    difficulty,
    left,
    right,
    answer: left + right,
  };
}
