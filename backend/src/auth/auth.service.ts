import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyPasswordHash!: string;

  async onModuleInit(): Promise<void> {
    this.dummyPasswordHash = await argon2.hash(
      randomBytes(32).toString('base64url'),
      { type: argon2.argon2id },
    );
  }

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const nicknameKey = dto.nickname.toLowerCase().normalize('NFC');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          nickname: dto.nickname,
          nicknameKey,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          createdAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('E-mail lub nick jest już zajęty.');
      }

      throw error;
    }
  }

  async validateCredentials(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        passwordHash: true,
      },
    });

    const hashToVerify = user?.passwordHash ?? this.dummyPasswordHash;

    const passwordMatches = await argon2.verify(hashToVerify, dto.password);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Nieprawidłowy e-mail lub hasło.');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };
  }
}
