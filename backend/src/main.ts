import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

/// Validación global
  app.useGlobalPipes( /// Configuramos la validación global para toda la aplicación
    new ValidationPipe({ /// ValidationPipe: Valida y transforma los datos de entrada según los DTOs definidos.
      whitelist: true, /// whitelist: Elimina propiedades no definidas en los DTOs.
      forbidNonWhitelisted: true, /// forbidNonWhitelisted: Lanza un error si hay propiedades no definidas.
      transform: true, /// transform: Convierte los datos de entrada a los tipos definidos en los DTOs.
    }),
  );

/// Seguridad global con JWT
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
///LucasAlvarezS && Bacze12/EWC-titulo