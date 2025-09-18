import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // 👈 esto es clave
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        'http://localhost:5173', // Vite
        'http://localhost:8081', // Expo web dev
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8081',
      ];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      // Permitir orígenes de la misma red local en desarrollo (simple check)
      if (/^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[0-1]))\./.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//Bacze12/EWC-titulo
