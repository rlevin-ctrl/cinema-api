import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Єдиний формат помилок для всього API.
 * Перехоплює і HttpException, і помилки БД, і непередбачені винятки,
 * щоб клієнт ніколи не отримував різнорідні структури або стек.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      message,
      error: HttpStatus[status] ?? "Error",
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === "string") {
        return { status, message: payload };
      }

      const message = (payload as { message?: string | string[] }).message;
      return {
        status,
        message: Array.isArray(message)
          ? message.join("; ")
          : (message ?? exception.message),
      };
    }

    if (exception instanceof QueryFailedError) {
      const code = (exception as QueryFailedError & { code?: string }).code;

      if (code === "23505") {
        return {
          status: HttpStatus.CONFLICT,
          message: "Запис з такими даними вже існує",
        };
      }
      if (code === "23503") {
        return {
          status: HttpStatus.CONFLICT,
          message: "Запис використовується в інших даних і не може бути змінений",
        };
      }
      if (code === "23514") {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Дані порушують обмеження цілісності бази даних",
        };
      }

      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Некоректний запит до бази даних",
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Внутрішня помилка сервера",
    };
  }
}
