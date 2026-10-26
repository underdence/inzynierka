import { generateAddition } from './generate-addition';
import { generateSubtraction } from './generate-subtraction';
import { generateMultiplication } from './generate-multiplication';
import { generateDivision } from './generate-division';
import type { Operation, Difficulty, MathTask } from './math.types';

export function generateTask(
  operation: Operation,
  difficulty: Difficulty,
): MathTask {
  if (operation === 'addition') {
    return generateAddition(difficulty);
  } else if (operation === 'division') {
    return generateDivision(difficulty);
  } else if (operation === 'multiplication') {
    return generateMultiplication(difficulty);
  } else {
    return generateSubtraction(difficulty);
  }
}
