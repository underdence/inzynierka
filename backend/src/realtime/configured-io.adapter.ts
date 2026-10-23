import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

export class ConfiguredIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly frontendOrigin: string,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const serverOptions = {
      ...options,
      cors: {
        origin: this.frontendOrigin,
        credentials: true,
      },
    } satisfies Partial<ServerOptions>;

    return super.createIOServer(port, serverOptions as ServerOptions) as Server;
  }
}
