import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';

export function generateDivision(difficulty: Difficulty): MathTask {
  let min: number;
  let divisorMax: number;
  let answerMax: number;

  if (difficulty === 'easy') {
    min = 1;
    divisorMax = 10;
    answerMax = 10;
  } else if (difficulty === 'medium') {
    min = 2;
    divisorMax = 12;
    answerMax = 12;
  } else {
    min = 2;
    divisorMax = 20;
    answerMax = 50;
  }

  const right = randomInt(min, divisorMax);
  const answer = randomInt(min, answerMax);
  const left = right * answer;

  return {
    id: randomUUID(),
    operation: 'division',
    difficulty,
    left,
    right,
    answer,
  };
}
