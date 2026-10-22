import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let messages = ['Wewnętrzny błąd serwera.'];

    if (exception instanceof HttpException && status < 500) {
      const body = exception.getResponse();

      if (typeof body === 'string') {
        messages = [body];
      } else if ('message' in body) {
        const message: unknown = body.message;

        if (typeof message === 'string') {
          messages = [message];
        } else if (
          Array.isArray(message) &&
          message.every((item: unknown) => typeof item === 'string')
        ) {
          messages = message;
        } else {
          messages = ['Nie udało się obsłużyć żądania.'];
        }
      } else {
        messages = ['Nie udało się obsłużyć żądania.'];
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.path} — HTTP ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: messages,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }
}
