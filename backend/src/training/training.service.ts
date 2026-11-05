import { createTrainingSession } from './create-training-session';
import { toStartTrainingResponse } from './to-start-training-response';
import { TrainingSessionStore } from './training-session.store';
import { toTrainingQuestion } from './to-training-question';
import type {
  TrainingSettings,
  StartTrainingResponse,
  TrainingSession,
  TrainingQuestion,
  SubmitTrainingAnswer,
  TrainingAnswerResponse,
  TrainingSummary,
} from './training.types';
import type { MathTask } from '../math/math.types';
import { prepareTaskKeys } from './prepare-task-keys';
import { generateUnusedTask } from '../math/generate-unused-task';
import { getTaskKey } from '../math/get-task-key';
import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class TrainingService {
  constructor(private readonly store: TrainingSessionStore) {}

  start(
    playerId: string,
    playerType: 'user' | 'guest',
    settings: TrainingSettings,
  ): StartTrainingResponse {
    const session = createTrainingSession(playerId, playerType, settings);

    this.store.save(session);

    return toStartTrainingResponse(session);
  }

  private findOwnedSession(
    sessionId: string,
    playerId: string,
    playerType: 'user' | 'guest',
  ): TrainingSession {
    const session = this.store.findById(sessionId);

    if (session === undefined) {
      throw new NotFoundException('Nie znaleziono treningu.');
    }

    if (session.playerId !== playerId || session.playerType !== playerType) {
      throw new NotFoundException('Nie znaleziono treningu.');
    }

    return session;
  }

  private ensureSessionActive(session: TrainingSession): void {
    if (Date.now() >= session.endsAt) {
      throw new GoneException('Czas treningu minął.');
    }
  }

  getCurrentQuestion(
    sessionId: string,
    playerId: string,
    playerType: 'user' | 'guest',
  ): TrainingQuestion {
    const session = this.findOwnedSession(sessionId, playerId, playerType);
    this.ensureSessionActive(session);

    return toTrainingQuestion(session.currentTask);
  }

  private ensureCurrentQuestion(
    session: TrainingSession,
    questionId: string,
  ): void {
    if (session.currentTask.id !== questionId) {
      throw new ConflictException('Odpowiedź dotyczy nieaktualnego zadania.');
    }
  }

  private advanceQuestion(
    session: TrainingSession,
    replacementTask: MathTask,
  ): void {
    const nextTask = session.pendingTasks.shift();

    if (nextTask === undefined) {
      throw new Error('Brak kolejnego zadania w treningu.');
    }

    session.currentTask = nextTask;

    session.pendingTasks.push(replacementTask);
  }

  private replenishAndAdvance(session: TrainingSession): void {
    const keys = prepareTaskKeys(session);

    const replacementTask = generateUnusedTask(
      session.settings.operations,
      session.settings.difficulty,
      keys,
    );

    keys.add(getTaskKey(replacementTask));
    this.advanceQuestion(session, replacementTask);
    session.usedTaskKeys = keys;
  }

  submitAnswer(
    sessionId: string,
    playerId: string,
    playerType: 'user' | 'guest',
    input: SubmitTrainingAnswer,
  ): TrainingAnswerResponse {
    const session = this.findOwnedSession(sessionId, playerId, playerType);

    this.ensureSessionActive(session);
    this.ensureCurrentQuestion(session, input.questionId);

    const correct = input.answer === session.currentTask.answer;

    if (correct) {
      this.replenishAndAdvance(session);

      session.score += 1;
    }

    session.attempts += 1;

    return {
      correct,
      score: session.score,
      attempts: session.attempts,
      question: toTrainingQuestion(session.currentTask),
    };
  }

  getSummary(
    sessionId: string,
    playerId: string,
    playerType: 'user' | 'guest',
  ): TrainingSummary {
    const session = this.findOwnedSession(sessionId, playerId, playerType);

    return {
      sessionId: session.id,
      score: session.score,
      attempts: session.attempts,
      startedAt: session.startedAt,
      endsAt: session.endsAt,
      finished: Date.now() >= session.endsAt,
    };
  }
}
