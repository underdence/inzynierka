import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';

export function generateSubtraction(difficulty: Difficulty): MathTask {
  let max: number;
  if (difficulty === 'easy') {
    max = 20;
  } else if (difficulty === 'medium') {
    max = 100;
  } else {
    max = 1000;
  }

  let left = randomInt(0, max);

  let right = randomInt(0, max);

  if (difficulty === 'easy' && left < right) {
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
