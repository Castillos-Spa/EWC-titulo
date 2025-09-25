import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = [
    // La URL de Vercel viene de la variable de entorno
    process.env.CORS_ORIGIN,
    'http://localhost', // Para desarrollo local
    'http://127.0.0.1',
    // Puedes agregar otras URLs de desarrollo si las necesitas
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Si el origen de la petición está en la lista, permitirla
      if (!origin || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
        return callback(null, true);
      }

      // También mantener la lógica de IPs locales si la necesitas
      const lan = /^https?:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[0-1]))\.[0-9.]+(?::\d+)?$/;
      if (lan.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
