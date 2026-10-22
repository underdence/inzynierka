import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nickname: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
