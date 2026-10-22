import { ForbiddenException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export class TrustedOriginGuard implements CanActivate {
  constructor(private readonly frontendOrigin: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    if (request.headers.origin !== this.frontendOrigin) {
      throw new ForbiddenException('Niedozwolone źródło żądania.');
    }

    return true;
  }
}
