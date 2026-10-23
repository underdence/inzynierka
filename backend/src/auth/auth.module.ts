import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GuestSessionService } from './guest-session.service';
import { PlayerAuthGuard } from './player-auth.guard';
import { PlayerIdentityService } from './player-identity.service';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 10,
          blockDuration: 60_000,
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    ThrottlerGuard,
    GuestSessionService,
    PlayerAuthGuard,
    PlayerIdentityService,
  ],
  exports: [PlayerIdentityService],
})
export class AuthModule {}
