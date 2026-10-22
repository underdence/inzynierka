import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { TrustedOriginGuard } from './common/guards/trusted-origin.guard';

export function configureApp(
  app: INestApplication,
  frontendOrigin: string,
): void {
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
