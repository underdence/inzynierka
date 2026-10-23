import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { parse } from 'cookie';
import { PlayerIdentityService } from '../auth/player-identity.service';

@WebSocketGateway({
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly diagnosticRoom = 'diagnostic:socket-spike';

  constructor(
    private readonly config: ConfigService,
    private readonly playerIdentityService: PlayerIdentityService,
  ) {}

  afterInit(namespace: Namespace): void {
    const allowedOrigin = this.config.getOrThrow<string>('FRONTEND_ORIGIN');

    namespace.use((socket, next) => {
      if (socket.handshake.headers.origin !== allowedOrigin) {
        next(new Error('Niedozwolone źródło połączenia.'));
        return;
      }

      const cookies = parse(socket.handshake.headers.cookie ?? '');

      void this.playerIdentityService
        .resolve(cookies.math_duel_session, cookies.math_duel_guest)
        .then(
          (player) => {
            this.logger.log(
              `Rozpoznano gracza: ${player.type}, id=${player.id}`,
            );

            next();
          },
          (error: unknown) => {
            if (error instanceof UnauthorizedException) {
              next(new Error('Brak ważnej sesji gracza.'));
              return;
            }

            this.logger.error(
              'Błąd sprawdzania sesji Socket.IO.',
              error instanceof Error ? error.stack : undefined,
            );

            next(new Error('Nie udało się sprawdzić sesji.'));
          },
        );
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Połączono klienta: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Rozłączono klienta: ${client.id}`);
  }

  @SubscribeMessage('connection:check')
  async handleConnectionCheck(@ConnectedSocket() client: Socket) {
    const cookies = parse(client.handshake.headers.cookie ?? '');

    try {
      const player = await this.playerIdentityService.resolve(
        cookies.math_duel_session,
        cookies.math_duel_guest,
      );

      this.logger.log(`Odebrano connection:check od ${client.id}`);

      return {
        ok: true,
        socketId: client.id,
        serverTime: new Date().toISOString(),
        player,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        return {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesja wygasła lub została unieważniona.',
          },
        };
      }

      this.logger.error(
        'Błąd obsługi connection:check.',
        error instanceof Error ? error.stack : undefined,
      );

      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Nie udało się obsłużyć wiadomości.',
        },
      };
    }
  }

  @SubscribeMessage('diagnostic:join')
  async handleDiagnosticJoin(@ConnectedSocket() client: Socket) {
    const cookies = parse(client.handshake.headers.cookie ?? '');

    try {
      const player = await this.playerIdentityService.resolve(
        cookies.math_duel_session,
        cookies.math_duel_guest,
      );

      await client.join(this.diagnosticRoom);

      this.logger.log(
        `Gracz ${player.id}, połączenie ${client.id}, dołączył do ${this.diagnosticRoom}`,
      );

      return {
        ok: true,
        room: this.diagnosticRoom,
        player: {
          type: player.type,
          id: player.id,
          nickname: player.nickname,
        },
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        return {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesja wygasła lub została unieważniona.',
          },
        };
      }

      this.logger.error(
        'Błąd obsługi diagnostic:join.',
        error instanceof Error ? error.stack : undefined,
      );

      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Nie udało się dołączyć do pokoju diagnostycznego.',
        },
      };
    }
  }

  @SubscribeMessage('diagnostic:ping')
  async handleDiagnosticPing(@ConnectedSocket() client: Socket) {
    const cookies = parse(client.handshake.headers.cookie ?? '');

    try {
      const player = await this.playerIdentityService.resolve(
        cookies.math_duel_session,
        cookies.math_duel_guest,
      );

      if (!client.rooms.has(this.diagnosticRoom)) {
        return {
          ok: false,
          error: {
            code: 'NOT_IN_ROOM',
            message: 'Najpierw dołącz do pokoju diagnostycznego.',
          },
        };
      }

      const notification = {
        sender: {
          type: player.type,
          id: player.id,
          nickname: player.nickname,
        },
        message: 'Pozdrowienia z drugiej przeglądarki!',
        serverTime: new Date().toISOString(),
      };

      client.nsp
        .to(this.diagnosticRoom)
        .emit('diagnostic:message', notification);

      return {
        ok: true,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        return {
          ok: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesja wygasła lub została unieważniona.',
          },
        };
      }

      this.logger.error(
        'Błąd obsługi diagnostic:ping.',
        error instanceof Error ? error.stack : undefined,
      );

      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Nie udało się wysłać wiadomości.',
        },
      };
    }
  }
}
