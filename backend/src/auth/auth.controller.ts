import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GuestSessionService } from './guest-session.service';
import { PlayerAuthGuard } from './player-auth.guard';
import type { PlayerRequest } from './player-request';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly config: ConfigService,
    private readonly guestSessionService: GuestSessionService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateCredentials(dto);
    const session = await this.sessionService.create(user.id);

    response.cookie('math_duel_session', session.token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    response.setHeader('Cache-Control', 'no-store');

    return {
      player: {
        type: 'user' as const,
        ...user,
      },
    };
  }

  @Get('me')
  @UseGuards(PlayerAuthGuard)
  me(
    @Req() request: PlayerRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');

    return { player: request.player };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');

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

    await this.sessionService.revoke(accountToken);
    await this.guestSessionService.revoke(guestToken);

    const cookieOptions = {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.clearCookie('math_duel_session', cookieOptions);
    response.clearCookie('math_duel_guest', cookieOptions);
  }

  @Post('guest')
  @UseGuards(ThrottlerGuard)
  async guest(@Res({ passthrough: true }) response: Response) {
    const session = await this.guestSessionService.create();

    response.cookie('math_duel_guest', session.token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    response.setHeader('Cache-Control', 'no-store');

    return { player: session.player };
  }
}
