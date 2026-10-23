import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { TrustedOriginGuard } from './common/guards/trusted-origin.guard';
import { ConfiguredIoAdapter } from './realtime/configured-io.adapter';

export function configureApp(
  app: INestApplication,
  frontendOrigin: string,
): void {
  app.useWebSocketAdapter(new ConfiguredIoAdapter(app, frontendOrigin));
  app.use(cookieParser());
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });
  app.useGlobalGuards(new TrustedOriginGuard(frontendOrigin));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
