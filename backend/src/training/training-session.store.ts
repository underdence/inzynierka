import { Injectable } from '@nestjs/common';
import type { TrainingSession } from './training.types';
import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class TrainingSessionStore implements OnModuleInit, OnModuleDestroy {
  private cleanupTimer: ReturnType<typeof setInterval> | undefined;

  private readonly sessions = new Map<string, TrainingSession>();

  save(session: TrainingSession): void {
    this.sessions.set(session.id, session);
  }

  findById(sessionId: string): TrainingSession | undefined {
    return this.sessions.get(sessionId);
  }

  removeExpired(): void {
    const now = Date.now();
    const retentionMs = 10 * 60 * 1000;

    for (const [sessionId, session] of this.sessions) {
      if (now >= session.endsAt + retentionMs) {
        this.sessions.delete(sessionId);
      }
    }
  }

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => {
      this.removeExpired();
    }, 60_000);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer !== undefined) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
