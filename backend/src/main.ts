import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Middleware para loguear el tiempo de cada petición
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const time = Date.now() - start;
      console.log(`⏳ ${req.method} ${req.url} - ${time}ms`);
    });
    next();
  });

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
  // Optional memory usage logging for diagnosing memory pressure. Enable by setting ENABLE_MEM_LOG=1
  if (process.env.ENABLE_MEM_LOG === '1') {
    setInterval(() => {
      const m = process.memoryUsage();
      console.log('[mem-monitor]', {
        rss: Math.round(m.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(m.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(m.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round((m.external || 0) / 1024 / 1024) + 'MB',
      });
    }, 30_000);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
bootstrap().catch(error => {
  console.error('Error durante la inicialización de Nest', error);
  process.exitCode = 1;
});
