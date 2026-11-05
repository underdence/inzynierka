import { tryGenerateUnusedTask } from './try-generate-unused-task';
import { findUnusedAddition } from './find-unused-addition';
import { findUnusedSubtraction } from './find-unused-subtraction';
import { findUnusedMultiplication } from './find-unused-multiplication';
import { findUnusedDivision } from './find-unused-division';
import type { Operation, Difficulty, MathTask } from './math.types';

export function generateUnusedTask(
  operations: Operation[],
  difficulty: Difficulty,
  blockedKeys: Set<string>,
): MathTask {
  const randomTask = tryGenerateUnusedTask(operations, difficulty, blockedKeys);

  if (randomTask !== undefined) {
    return randomTask;
  }

  for (const operation of new Set(operations)) {
    let task: MathTask | undefined;

    if (operation === 'addition') {
      task = findUnusedAddition(difficulty, blockedKeys);
    } else if (operation === 'subtraction') {
      task = findUnusedSubtraction(difficulty, blockedKeys);
    } else if (operation === 'multiplication') {
      task = findUnusedMultiplication(difficulty, blockedKeys);
    } else {
      task = findUnusedDivision(difficulty, blockedKeys);
    }

    if (task !== undefined) {
      return task;
    }
  }

  throw new Error('Brak dostępnego zadania dla wybranych ustawień.');
}
