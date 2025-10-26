
import { Controller, Get, Inject, Res, UseGuards, Request } from '@nestjs/common';
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
@Controller()
@SkipThrottle()
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    @Inject(VIEW_SERVICE) private readonly viewService: ViewService,
    private readonly postsService: PostsService,
    private readonly usersService: UsersService, 
  ) {}

  @Get()
  // Izinkan user anonim (logout) dan user terotentikasi (login)
  @UseGuards(AuthGuard(['jwt', 'anonymous'])) 
  public async home(
    @Res() res: Response,
    @Request() req, 
  ) {
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

  @Get('/about')
  public about(@Res() res: Response) {
    this.viewService.render(res, 'pages/about', {
      pageTitle: 'Tentang Kami',
    });
  }
}