import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await applySecurityMiddleware(app);

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

  // Middleware para loguear el tiempo de cada petición
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const time = Date.now() - start;
      console.log(`⏳ ${req.method} ${req.url} - ${time}ms`);
    });
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
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

async function applySecurityMiddleware(app: any) {
  try {
    const helmetModule = await import('helmet');
    const helmet = helmetModule?.default ?? helmetModule;
    if (typeof helmet === 'function') {
      app.use(helmet());
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('helmet no está instalado; omitiendo middleware de seguridad', error);
    }
  }

  try {
    const compressionModule = await import('compression');
    const compression = compressionModule?.default ?? compressionModule;
    if (typeof compression === 'function') {
      app.use(compression());
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('compression no está instalado; omitiendo middleware de compresión', error);
    }
  }
}
