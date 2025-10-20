import { Controller, Get, Inject, Res } from '@nestjs/common'; // <-- Tambahkan Inject, Res, SkipThrottle
// Import SkipThrottle dari package yang benar
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
// --- TAMBAHAN IMPORT UNTUK TEMPLATING ---
import { Response } from 'express'; // <-- Untuk object response Express
import { VIEW_SERVICE } from 'src/core/view/view.constants'; // <-- Token service
import { ViewService } from 'src/core/view/view.service';    // <-- Class service
// --- AKHIR TAMBAHAN IMPORT ---

@ApiTags('Home')
// @Controller() // Jika Anda masih ingin controller ini di root
@Controller() // Atau hapus @Controller() jika route home dipindah
@SkipThrottle() // Tambahkan ini (dari contoh sebelumnya) jika ingin skip rate limiting
export class HomeController {
  constructor(
    private readonly homeService: HomeService, // <-- Service asli tetap ada
    @Inject(VIEW_SERVICE) private readonly viewService: ViewService, // <-- INJECT VIEW SERVICE BARU KITA
  ) {}
  // Ganti 'private service: HomeService' menjadi 'private readonly homeService: HomeService'
  // agar konsisten dengan gaya NestJS modern.
  @Get() // Tetap di root ('/')
  public home(@Res() res: Response) { // <-- Tambahkan @Res() res: Response
    // Panggil service untuk merender (Abstraksi a)
    this.viewService.render(res, 'pages/home', { // Path relatif dari folder 'views'
      pageTitle: 'Halaman Utama',
      pesan: 'Data ini dikirim dari controller!',
    });
    // Tidak ada 'return' lagi, karena render() langsung mengirim response
  }
  @Get('/about') // Route baru
  public about(@Res() res: Response) {
    this.viewService.render(res, 'pages/about', {
      pageTitle: 'Tentang Kami',
    });
  }
} // Akhir class HomeController
