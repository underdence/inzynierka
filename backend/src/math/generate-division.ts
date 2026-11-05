import { randomUUID } from 'node:crypto';
import { randomInt } from './random-int';
import type { Difficulty, MathTask } from './math.types';
import { DIVISION_RANGES } from './math.config';

export function generateDivision(difficulty: Difficulty): MathTask {
  const ranges = DIVISION_RANGES[difficulty];

  const right = randomInt(ranges.divisor.min, ranges.divisor.max);
  const answer = randomInt(ranges.answer.min, ranges.answer.max);
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
