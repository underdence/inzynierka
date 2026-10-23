import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { GuestSessionService } from './guest-session.service';
import type { Player } from './player-request';

@Injectable()
export class PlayerIdentityService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly guestSessionService: GuestSessionService,
  ) {}

  async resolve(accountToken: unknown, guestToken: unknown): Promise<Player> {
    if (accountToken !== undefined) {
      try {
        const user = await this.sessionService.getUser(accountToken);

        return {
          type: 'user',
          ...user,
        };
      } catch (error: unknown) {
        if (!(error instanceof UnauthorizedException)) {
          throw error;
        }
      }
    }

    return this.guestSessionService.getPlayer(guestToken);
  }
}
