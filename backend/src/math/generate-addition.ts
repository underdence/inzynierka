import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';

export function generateAddition(difficulty: Difficulty): MathTask {
  let max: number;
  if (difficulty === 'easy') {
    max = 20;
  } else if (difficulty === 'medium') {
    max = 100;
  } else {
    max = 1000;
  }

  const left = randomInt(0, max);

  const right = randomInt(0, max);

  return {
    id: randomUUID(),
    operation: 'addition',
    difficulty,
    left,
    right,
    answer: left + right,
  };
}
