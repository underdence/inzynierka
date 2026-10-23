import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { PlayerRequest } from './player-request';
import { PlayerIdentityService } from './player-identity.service';

@Injectable()
export class PlayerAuthGuard implements CanActivate {
  constructor(private readonly playerIdentityService: PlayerIdentityService) {}

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

    request.player = await this.playerIdentityService.resolve(
      accountToken,
      guestToken,
    );

    return true;
  }
}
