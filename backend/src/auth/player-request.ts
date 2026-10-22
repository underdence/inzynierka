import type { Request } from 'express';

export type Player =
  | {
      type: 'user';
      id: string;
      email: string;
      nickname: string;
    }
  | {
      type: 'guest';
      id: string;
      nickname: string;
    };

export interface PlayerRequest extends Request {
  player: Player;
}
