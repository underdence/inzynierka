import type { MathTask, Difficulty, Operation } from '../math/math.types';

export type TrainingQuestion = Omit<MathTask, 'answer'>;

export type TrainingDuration = 30 | 60 | 120;

export interface TrainingSettings {
  operations: Operation[];
  difficulty: Difficulty;
  durationSeconds: TrainingDuration;
}

export interface TrainingSession {
  id: string;
  playerId: string;
  playerType: 'user' | 'guest';
  settings: TrainingSettings;
  startedAt: number;
  endsAt: number;
  score: number;
  attempts: number;
  currentTask: MathTask;
  pendingTasks: MathTask[];
  usedTaskKeys: Set<string>;
}

export interface StartTrainingResponse {
  sessionId: string;
  question: TrainingQuestion;
  startedAt: number;
  endsAt: number;
  score: number;
}

export interface SubmitTrainingAnswer {
  questionId: string;
  answer: number;
}

export interface TrainingAnswerResponse {
  correct: boolean;
  score: number;
  attempts: number;
  question: TrainingQuestion;
}

export interface TrainingSummary {
  sessionId: string;
  score: number;
  attempts: number;
  startedAt: number;
  endsAt: number;
  finished: boolean;
}
