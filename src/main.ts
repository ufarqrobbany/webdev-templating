import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  RequestMethod
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

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/', '/about', 'login', 'register', 'create-post', 'logout', { path: '/users/:id/profile', method: RequestMethod.GET }],
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

  // Daftarkan cookie-parser middleware
  app.use(cookieParser());

  const viewService = app.get<ViewService>(VIEW_SERVICE);

  // Sajikan aset statis (CSS/JS)
  app.useStaticAssets(viewService.getActiveThemeAssetPath(), {
    prefix: '/static/',
  });

  // Set base view directory
  app.setBaseViewsDir(path.join(process.cwd(), 'themes'));

  // Set view engine ke HBS
  app.setViewEngine('hbs');

  // 👇 2. GANTI BLOK TRY...CATCH DENGAN YANG INI 👇
  // Daftarkan Partials dari folder default
  const partialsDir = path.join(process.cwd(), 'themes/default/views/partials');
  
  // Daftarkan Partials secara SYNCHRONOUS menggunakan fs
  try {
      const filenames = fs.readdirSync(partialsDir);
      filenames.forEach(filename => {
          // Hanya ambil file .hbs
          const matches = /^([^.]+)\.hbs$/.exec(filename);
          if (!matches) return;
          
          const name = matches[1]; // Ambil nama partial (misal: _post-item)
          const template = fs.readFileSync(path.join(partialsDir, filename), 'utf8');
          hbs.registerPartial(name, template);
      });
      console.log('✅ HBS Partials registered manually (synchronously).');
  } catch (e) {
      // Fallback jika ada masalah I/O
      console.error('❌ Manual partial registration failed. Falling back to hbs.registerPartials(dir).', e.message);
      hbs.registerPartials(partialsDir);
  }
    
  // 👇 3. UNCOMMENT PEMANGGILAN INI 👇
  // Panggil fungsi pendaftaran helper dari hbs.helpers.ts
  registerHbsHelpers();

  // Start aplikasi
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
