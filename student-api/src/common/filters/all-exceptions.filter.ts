import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../database/prisma';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

/** One consistent error shape. Unexpected errors never leak SQL/stack traces to the client. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const payload = body as { message?: string | string[]; error?: string };
        message = payload.message ?? exception.message;
        error = payload.error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Safety net only; call sites map the expected Prisma errors deliberately.
      if (exception.code === 'P2002') [status, message] = [HttpStatus.CONFLICT, 'Resource already exists'];
      else if (exception.code === 'P2025') [status, message] = [HttpStatus.NOT_FOUND, 'Resource not found'];
      else if (exception.code === 'P2003') [status, message] = [HttpStatus.CONFLICT, 'Resource is referenced by other data'];
      else this.logger.error(`Prisma error ${exception.code}`, exception.stack);
    } else {
      this.logger.error(exception instanceof Error ? exception.message : 'Unknown error', exception instanceof Error ? exception.stack : undefined);
    }

    const body: ErrorBody = { statusCode: status, message, path: request.url, timestamp: new Date().toISOString() };
    if (error) body.error = error;
    response.status(status).json(body);
  }
}
