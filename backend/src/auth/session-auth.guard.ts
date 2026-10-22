import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-request';
import { SessionService } from './session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const cookies: unknown = request.cookies;

    const token =
      typeof cookies === 'object' &&
      cookies !== null &&
      'math_duel_session' in cookies
        ? cookies.math_duel_session
        : undefined;

    request.user = await this.sessionService.getUser(token);

    return true;
  }
}
