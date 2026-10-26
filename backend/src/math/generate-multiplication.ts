import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';

export function generateMultiplication(difficulty: Difficulty): MathTask {
  let min: number;
  let leftMax: number;
  let rightMax: number;

  if (difficulty === 'easy') {
    min = 1;
    leftMax = 10;
    rightMax = 10;
  } else if (difficulty === 'medium') {
    min = 2;
    leftMax = 12;
    rightMax = 12;
  } else {
    min = 2;
    leftMax = 20;
    rightMax = 50;
  }

  const left = randomInt(min, leftMax);
  const right = randomInt(min, rightMax);

  return {
    id: randomUUID(),
    operation: 'multiplication',
    difficulty,
    left,
    right,
    answer: left * right,
  };
}
