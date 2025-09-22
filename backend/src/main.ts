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
      // Permitir peticiones sin origen (ej. curl, Postman) y el SSR interno
      if (!origin) return callback(null, true);

      // Aceptar localhost/127.0.0.1 en cualquier puerto (vite puede moverse 5173->5174, etc.)
      const localhost = /^https?:\/\/localhost(?::\d+)?$/;
      const loopback = /^https?:\/\/127\.0\.0\.1(?::\d+)?$/;

      // Aceptar IPs de red local comunes: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
      const lan = /^https?:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[0-1]))\.[0-9.]+(?::\d+)?$/;

      if (localhost.test(origin) || loopback.test(origin) || lan.test(origin)) {
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
//Bacze12/EWC-titulo
