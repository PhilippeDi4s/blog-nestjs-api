import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { parseCorsWhitelist } from './commoun/utils/parseCorsWhitelist';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
    cookieParser(),
  );

  const corsWhiteList = parseCorsWhitelist(process.env.CORS_WHITELIST ?? '');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (...args: any[]) => void,
    ) => {
      if (!origin || corsWhiteList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formatted = errors.map((err) => ({
          code: `INVALID_${err.property.toUpperCase()}`,
          field: err.property,
          message: Object.values(err.constraints ?? {})[0],
        }));
        return new BadRequestException({ errors: formatted });
      },
    }),
  );

  await app.listen(process.env.APP_PORT ?? 3001);
}
void bootstrap();
