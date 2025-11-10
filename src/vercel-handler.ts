import 'reflect-metadata';
import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Express } from 'express';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

let cachedServer: Express | null = null;

async function bootstrapServer(): Promise<Express> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // DI for class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.getOrThrow('app.apiPrefix', { infer: true }));
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger for API
  const swaggerOptions = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: { example: 'en' },
    })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('docs', app, document);

  // Cookies and CORS
  app.use(cookieParser());
  const allowed = process.env.FRONTEND_ORIGIN?.split(',').map((s) => s.trim());
  app.enableCors({
    origin: allowed && allowed.length > 0 ? allowed : true,
    credentials: true,
  });

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Vercel serverless entry (Node.js runtime)
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return (cachedServer as any)(req, res);
}
