import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { SessionService } from './session.service';
import { GuestSessionService } from './guest-session.service';
import type { PlayerRequest } from './player-request';

@Injectable()
export class PlayerAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly guestSessionService: GuestSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlayerRequest>();

    const cookies: unknown = request.cookies;

    const accountToken =
      typeof cookies === 'object' &&
      cookies !== null &&
      'math_duel_session' in cookies
        ? cookies.math_duel_session
        : undefined;

    const guestToken =
      typeof cookies === 'object' &&
      cookies !== null &&
      'math_duel_guest' in cookies
        ? cookies.math_duel_guest
        : undefined;

    if (accountToken !== undefined) {
      try {
        const user = await this.sessionService.getUser(accountToken);

        request.player = {
          type: 'user',
          ...user,
        };

        return true;
      } catch (error: unknown) {
        if (!(error instanceof UnauthorizedException)) {
          throw error;
        }
      }
    }

    request.player = await this.guestSessionService.getPlayer(guestToken);

    return true;
  }
}
