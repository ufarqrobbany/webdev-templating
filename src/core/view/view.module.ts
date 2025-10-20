import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ViewService } from './view.service';
import viewConfig from 'src/config/view.config';
import { VIEW_SERVICE } from './view.constants';

@Global() // <-- PENTING!
@Module({
  imports: [
    ConfigModule.forFeature(viewConfig), // Memuat konfigurasi 'view'
  ],
  providers: [
    {
      provide: VIEW_SERVICE, // Mendaftarkan service
      useClass: ViewService,
    },
  ],
  exports: [VIEW_SERVICE], // Mengekspor service agar bisa di-inject
})
export class ViewModule {}