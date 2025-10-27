import {
  Controller,
  Get,
  Inject,
  Res,
  UseGuards,
  Request,
  Redirect, // <-- TAMBAHIN INI
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';
import { Response } from 'express';
import { VIEW_SERVICE } from 'src/core/view/view.constants';
import { ViewService } from 'src/core/view/view.service';
import { PostsService } from 'src/posts/posts.service';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/domain/user';

@ApiTags('Home')
@Controller() // <-- Ini controller di root '/'
@SkipThrottle()
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    @Inject(VIEW_SERVICE) private readonly viewService: ViewService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @Get() // <-- Ini buat halaman '/' (udah ada)
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  public async home(@Res() res: Response, @Request() req) {
    let currentUser: User | null = null;
    let pesanSelamatDatang: string;

    // Cek apakah user login
    if (req.user) {
      // Jika login, ambil data user lengkap (termasuk relasi 'following')
      currentUser = await this.usersService.findById(req.user.id);
      pesanSelamatDatang = `Halo, ${currentUser?.firstName}! Ini timeline Anda:`;
    } else {
      // Jika anonim
      pesanSelamatDatang = 'Selamat datang! Ini postingan publik terbaru:';
    }

    // Ambil postingan
    // Service akan otomatis memfilter berdasarkan currentUser
    const posts = await this.postsService.findAll({
      paginationOptions: { page: 1, limit: 20 },
      currentUser: currentUser, // Teruskan user (bisa null)
    });

    this.viewService.render(res, 'pages/home', {
      pageTitle: 'Timeline',
      pesan: pesanSelamatDatang,
      user: currentUser, // Kirim data user ke view (untuk header, dll)
      posts: posts,
    });
  }

  @Get('/about') // <-- Ini buat halaman '/about' (udah ada)
  public about(@Res() res: Response) {
    this.viewService.render(res, 'pages/about', {
      pageTitle: 'Tentang Kami',
    });
  }

  // --- 👇 INI DIA ENDPOINT BARU YANG KITA BIKIN 👇 ---

  /**
   * Menampilkan halaman login
   */
  @Get('/login')
  public loginPage(@Res() res: Response) {
    this.viewService.render(res, 'pages/login', {
      pageTitle: 'Login',
    });
  }

  /**
   * Menampilkan halaman register
   */
  @Get('/register')
  public registerPage(@Res() res: Response) {
    this.viewService.render(res, 'pages/register', {
      pageTitle: 'Register',
    });
  }

  /**
   * Menampilkan halaman "Buat Postingan" (MVP 2)
   * Ini harus dilindungi, cuma user login yang boleh
   */
  @Get('/create-post')
  @UseGuards(AuthGuard('jwt')) // <-- Wajib login buat akses ini
  public createPostPage(@Res() res: Response) {
    this.viewService.render(res, 'pages/create-post', {
      pageTitle: 'Buat Postingan Baru',
      user: (res.req as any).user, // <-- Kirim data user ke view
    });
  }

  /**
   * Handle link logout dari header
   * Cukup redirect ke login
   */
  @Get('/logout')
  @Redirect('/login', 302) // <-- Langsung redirect ke halaman login
  public logout() {
    // Nanti Reqi bisa tambahin logic buat clear httpOnly cookie di sini
    // Untuk sekarang, redirect aja cukup buat ngetes
    // (Token di localStorage harusnya di-clear sama JS frontend, tapi kita belum buat)
  }
}
