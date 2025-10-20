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
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

// --- TAMBAHAN IMPORT UNTUK TEMPLATING ---
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- Ganti NestFactory dengan ini di create()
import * as path from 'path';
const hbs: any = require('hbs');
import { VIEW_SERVICE } from './core/view/view.constants'; // <-- Token service
import { ViewService } from './core/view/view.service';    // <-- Class service
// import { registerHbsHelpers } from './core/view/helpers/hbs.helpers'; // <-- Fungsi pendaftaran helper
// --- AKHIR TAMBAHAN IMPORT ---

async function bootstrap() {
  // const app = await NestFactory.create(AppModule, { cors: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/', '/about'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
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

  const viewService = app.get<ViewService>(VIEW_SERVICE);

  // (d) Beri tahu Express untuk menyajikan aset statis (CSS/JS)
  // dari path yang diberikan oleh service kita (dengan logika fallback)
  app.useStaticAssets(viewService.getActiveThemeAssetPath(), {
    prefix: '/static/', // Akses CSS di URL: /static/css/style.css
  });

  // (d) Beri tahu HBS bahwa 'root' dari semua file view adalah folder 'themes'
  app.setBaseViewsDir(path.join(process.cwd(), 'themes'));

  // (a) Beri tahu Express untuk menggunakan HBS sebagai View Engine
  app.setViewEngine('hbs');

  // (b) Beri tahu HBS di mana menemukan Partials (kita gunakan default sebagai basis)
  // hbs.handlebars.registerPartials( // <-- Tambahkan .handlebars
  //   path.join(process.cwd(), 'themes/default/views/partials'),
  // );

  // (c) Daftarkan helper kustom kita (block & contentFor) ke HBS
  try {
    if (typeof hbs.registerPartials === 'function') {
      hbs.registerPartials(path.join(process.cwd(), 'themes/default/views/partials'));
    } else if (hbs && hbs.handlebars && typeof (hbs.handlebars as any).registerPartials === 'function') {
      // some builds expose the method on the underlying handlebars instance
      (hbs.handlebars as any).registerPartials(path.join(process.cwd(), 'themes/default/views/partials'));
    } else {
      // Last-resort: warn instead of crashing — partials may be unavailable.
      // This keeps the app bootable and makes the issue visible in logs.
      // You can replace this with a manual partials registration if needed.
      // eslint-disable-next-line no-console
      console.warn('hbs.registerPartials is not available; theme partials were not registered');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to register hbs partials:', err);
  }
  // registerHbsHelpers();

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
  console.log(`Application is running on: ${await app.getUrl()}`); // Logging tetap ada
}
// void bootstrap(); // Ini juga tetap ada
void bootstrap();
