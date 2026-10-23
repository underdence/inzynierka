import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  configureApp(app, config.getOrThrow<string>('FRONTEND_ORIGIN'));

  if (config.get<string>('ENABLE_DIAGNOSTICS') === 'true') {
    app.useStaticAssets(join(process.cwd(), 'tools', 'socket-check'), {
      prefix: '/diagnostics/',
      index: false,
    });
  }

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
