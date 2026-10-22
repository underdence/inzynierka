import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GuestSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create() {
    const token = randomBytes(32).toString('base64url');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (let attempt = 0; attempt < 3; attempt++) {
      const nickname = `Gosc-${randomUUID().replaceAll('-', '').slice(0, 12)}`;

      try {
        const guest = await this.prisma.guestSession.create({
          data: {
            tokenHash,
            nickname,
            expiresAt,
          },
          select: {
            id: true,
            nickname: true,
          },
        });

        return {
          token,
          expiresAt,
          player: {
            type: 'guest' as const,
            id: guest.id,
            nickname: guest.nickname,
          },
        };
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Nie udało się utworzyć sesji gościa.');
  }

  async getPlayer(token: unknown) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new UnauthorizedException('Rozpocznij grę lub zaloguj się.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.guestSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        nickname: true,
        expiresAt: true,
      },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Rozpocznij grę lub zaloguj się.');
    }

    return {
      type: 'guest' as const,
      id: session.id,
      nickname: session.nickname,
    };
  }

  async revoke(token: unknown): Promise<void> {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return;
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.prisma.guestSession.deleteMany({
      where: { tokenHash },
    });
  }
}
