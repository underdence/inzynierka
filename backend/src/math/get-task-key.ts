import type { MathTask } from './math.types';

export function getTaskKey(task: MathTask): string {
  if (task.operation === 'addition' || task.operation === 'multiplication') {
    const min = Math.min(task.left, task.right);
    const max = Math.max(task.left, task.right);
    return `${task.operation}:${min}:${max}`;
  }

  return `${task.operation}:${task.left}:${task.right}`;
}
