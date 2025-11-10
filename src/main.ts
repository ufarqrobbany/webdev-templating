import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

// --- TAMBAHAN IMPORT UNTUK TEMPLATING ---
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- Ganti NestFactory dengan ini di create()
import * as path from 'path';
import hbs = require('hbs');
import { VIEW_SERVICE } from './core/view/view.constants'; // <-- Token service
import { ViewService } from './core/view/view.service'; // <-- Class service
import cookieParser from 'cookie-parser';
// 👇 1. UNCOMMENT IMPORT INI 👇
import { registerHbsHelpers } from './core/view/helpers/hbs.helpers';
import * as fs from 'fs';

// --- AKHIR TAMBAHAN IMPORT ---

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);
  // Resolve runtime mode
  const rawMode = (process.env.APP_MODE || '').toLowerCase();
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const isDevLike = ['dev', 'development', 'frontend-dev', 'local'].includes(rawMode) || (!rawMode && nodeEnv !== 'production');
  const isFrontend = rawMode === 'frontend' || isDevLike;

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: [
        '/',
        '/about',
        'login',
        'register',
        'create-post',
        'logout',
        { path: '/users/:id/profile', method: RequestMethod.GET },
        'search',
      ],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger hanya untuk mode API
  if (!isFrontend) {
    const options = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API docs')
      .setVersion('1.0')
      .addBearerAuth()
      .addGlobalParameters({
        in: 'header',
        required: false,
        name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
        schema: {
          example: 'en',
        },
      })
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);
  }

  // Daftarkan cookie-parser middleware
  app.use(cookieParser());

  if (isFrontend) {
    const viewService = app.get<ViewService>(VIEW_SERVICE);
    // Sajikan aset statis (CSS/JS)
    app.useStaticAssets(viewService.getActiveThemeAssetPath(), {
      prefix: '/static/',
    });

    // Set base view directory (use project root for both ts-node and dist)
    const viewsRoot = path.join(process.cwd(), 'themes');
    app.setBaseViewsDir(viewsRoot);
    // Set view engine ke HBS
    app.setViewEngine('hbs');

    // Daftarkan Partials secara SYNCHRONOUS menggunakan fs
  const partialsDir = path.join(viewsRoot, 'default/views/partials');
    try {
      const filenames = fs.readdirSync(partialsDir);
      filenames.forEach((filename) => {
        const matches = /^([^.]+)\.hbs$/.exec(filename);
        if (!matches) return;
        const name = matches[1];
        const template = fs.readFileSync(path.join(partialsDir, filename), 'utf8');
        hbs.registerPartial(name, template);
      });
      console.log('✅ HBS Partials registered manually (synchronously).');
    } catch (e) {
      console.error(
        '❌ Manual partial registration failed. Falling back to hbs.registerPartials(dir).',
        (e as any).message,
      );
      hbs.registerPartials(partialsDir);
    }

    // Panggil helper HBS
    registerHbsHelpers();
    console.log(`[views] mode=frontend${isDevLike ? '-dev' : ''} base=${path.join(viewsRoot)} partials=${partialsDir}`);
  } else {
    // Mode API: set CORS origin spesifik (jika tersedia)
    const allowed = process.env.FRONTEND_ORIGIN?.split(',').map((s) => s.trim());
    app.enableCors({
      origin: allowed && allowed.length > 0 ? allowed : true,
      credentials: true,
    });
  }

  // Start aplikasi
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
  console.log(`Application is running on: ${await app.getUrl()} [mode=${isFrontend ? 'frontend' : 'api'}]`);
}

void bootstrap();
