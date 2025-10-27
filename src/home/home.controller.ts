import {
  Controller,
  Get,
  Inject,
  Res,
  UseGuards,
  Request,
  Redirect,
  Param, 
  ParseIntPipe, 
  NotFoundException, 
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

    // Ambil postingan (ini adalah array Post[])
    const rawPosts = await this.postsService.findAll({
      paginationOptions: { page: 1, limit: 20 },
      currentUser: currentUser, 
    });

    // v-- TAMBAHKAN BLOK LOGIKA INI --v
    // Proses data post untuk HBS
    const posts = rawPosts.map(post => {
      // Cek apakah 'currentUser' (jika ada) ada di dalam array post.likedBy
      const isLikedByCurrentUser = currentUser
        ? (post.likedBy || []).some(user => user.id === currentUser.id)
        : false;

      // Kembalikan objek baru yang berisi data post + status like
      return {
        ...post,
        isLikedByCurrentUser: isLikedByCurrentUser,
      };
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

  @Get('users/:id/profile') // <-- Rute baru kita
  @UseGuards(AuthGuard(['jwt', 'anonymous'])) // Bisa dilihat oleh anonim & user login
  public async userProfile(
    @Param('id', ParseIntPipe) id: number, // Ambil ID dari URL
    @Res() res: Response,
    @Request() req,
  ) {
    let currentUser: User | null = null;
    if (req.user) {
      // Ambil data user yang sedang login (jika ada)
      currentUser = await this.usersService.findById(req.user.id);
    }

    // Ambil data user yang profilnya ingin dilihat
    const profileUser = await this.usersService.findById(id);

    if (!profileUser) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    // Ambil postingan HANYA dari user profil ini
    const posts = await this.postsService.findAll({
      paginationOptions: { page: 1, limit: 20 }, // Ambil 20 postingan
      authorId: id, // Filter berdasarkan ID user profil
      // currentUser tidak perlu diteruskan di sini karena filter authorId lebih spesifik
    });

    // TODO: Tambahkan logika untuk cek 'isFollowing' jika diperlukan di view
    // const isFollowing = currentUser?.following?.some(u => u.id === profileUser.id);

    // TODO: Ambil jumlah followers/following jika diperlukan di view
    // const followersCount = profileUser.followers?.length ?? 0;
    // const followingCount = profileUser.following?.length ?? 0;

    this.viewService.render(res, 'pages/profile', {
      pageTitle: `Profil ${profileUser.firstName}`,
      user: currentUser, // Data user yang sedang login (bisa null)
      profileUser: profileUser, // Data user yang profilnya dilihat
      posts: posts, // Postingan milik profileUser
      // isFollowing: isFollowing, // (Jika sudah diimplementasi)
      // followersCount: followersCount, // (Jika sudah diimplementasi)
      // followingCount: followingCount, // (Jika sudah diimplementasi)
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
