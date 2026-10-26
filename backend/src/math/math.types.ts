export type Operation =
  'addition' | 'subtraction' | 'multiplication' | 'division';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MathTask {
  id: string;
  operation: Operation;
  difficulty: Difficulty;
  left: number;
  right: number;
  answer: number;
}
