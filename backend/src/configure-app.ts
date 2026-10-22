import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

export function configureApp(
  app: INestApplication,
  frontendOrigin: string,
): void {
  app.enableCors({
    origin: frontendOrigin,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
