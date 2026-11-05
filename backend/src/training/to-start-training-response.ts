import type { TrainingSession, StartTrainingResponse } from './training.types';
import { toTrainingQuestion } from './to-training-question';

export function toStartTrainingResponse(
  session: TrainingSession,
): StartTrainingResponse {
  return {
    sessionId: session.id,
    question: toTrainingQuestion(session.currentTask),
    startedAt: session.startedAt,
    endsAt: session.endsAt,
    score: session.score,
  };
}
