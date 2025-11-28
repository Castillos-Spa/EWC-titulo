import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private isConnected = false;

  async $connectSafe() {
    if (!this.isConnected) {
      try {
        await this.$connect();
        this.isConnected = true;
        console.log('✅ Conexión establecida con Prisma/Neon');
      } catch (error) {
        console.warn('⚠ Prisma no pudo conectar aún. Reintentará automáticamente cuando se use.');
      }
    }
  }

  // Sobrescribimos cualquier query para forzar reconexión si no está conectado
  async $useMiddleware() {
    await this.$connectSafe();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
