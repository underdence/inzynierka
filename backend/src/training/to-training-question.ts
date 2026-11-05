import type { MathTask } from '../math/math.types';
import type { TrainingQuestion } from './training.types';

export function toTrainingQuestion(task: MathTask): TrainingQuestion {
  return {
    id: task.id,
    operation: task.operation,
    difficulty: task.difficulty,
    left: task.left,
    right: task.right,
  };
}
