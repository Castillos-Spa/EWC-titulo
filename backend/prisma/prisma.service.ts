import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client'; // Asegúrate de que la ruta coincida con tu output

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Loguear queries ejecutadas con duración (ms)
    (this as unknown as any).$on('query', (e: Prisma.QueryEvent) => {
      console.log('🕒 Query ejecutada:', e.query, 'Duración:', e.duration, 'ms');
    });

    // Opcional: exponer errores y warnings de Prisma en consola
    (this as unknown as any).$on('error', (e: Prisma.LogEvent) => {
      console.error('Prisma error:', e);
    });

    (this as unknown as any).$on('warn', (e: Prisma.LogEvent) => {
      console.warn('Prisma warning:', e);
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
