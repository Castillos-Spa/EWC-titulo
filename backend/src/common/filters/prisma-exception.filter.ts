import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const mapped = this.mapError(exception);

    response.status(mapped.status).json({
      message: mapped.message,
      code: exception.code,
    });
  }

  private mapError(error: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
    switch (error.code) {
      case 'P2002':
        return { status: HttpStatus.CONFLICT, message: 'Duplicate resource' };
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
      default:
        return { status: HttpStatus.BAD_REQUEST, message: 'Database error' };
    }
  }
}
