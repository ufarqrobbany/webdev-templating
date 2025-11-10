import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VIEW_SERVICE } from '../view/view.constants';
import { ViewService } from '../view/view.service';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  // Kita inject ViewService agar bisa me-render halaman hbs
  constructor(
    @Inject(VIEW_SERVICE) private readonly viewService: ViewService,
  ) {}

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Cek apakah request datang dari browser (menerima 'html')
    // atau dari API client (menerima 'json')
    const accepts = request.accepts(['html', 'json']);

    if (accepts === 'html') {
      // Jika dari browser, render halaman 404 kustom
      
      // Kita gunakan layout 'auth.hbs' sebagai layout minimalis
      // (asumsi layout ini tidak punya header/footer, hanya body)
      // Jika kamu punya layout lain yang lebih cocok, ganti di sini.
    //   const layoutPath = this.viewService.resolveViewPath('layouts/auth', false);

      this.viewService.render(response, 'pages/404', {
        pageTitle: 'Halaman Tidak Ditemukan',
        // layout: layoutPath, // Render tanpa layout utama
      });

    } else {
      // Jika ini adalah API call (misal: /api/v1/...),
      // kirim respon JSON 404 standar NestJS
      response.status(status).json({
        statusCode: status,
        message: exception.message,
        error: 'Not Found',
      });
    }
  }
}