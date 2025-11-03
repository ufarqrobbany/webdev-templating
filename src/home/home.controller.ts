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
  Query, 
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
import { FilterUserDto } from '../users/dto/query-user.dto';
import { Post } from '../posts/domain/post';

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
      pesanSelamatDatang = 'Selamat datang! Ini postingan publik terbaru';
    }

    // Ambil postingan (ini adalah array Post[])
    const rawPosts = await this.postsService.findAll({
      paginationOptions: { page: 1, limit: 20 },
      currentUser: currentUser, 
    });

    // Proses data post untuk HBS
    const posts = rawPosts.map(post => {
      // Cek apakah 'currentUser' (jika ada) ada di dalam array post.likedBy
      const isLikedByCurrentUser = currentUser
        ? (post.likedBy || []).some(user => user.id === currentUser.id)
        : false;

      const isAuthorFollowedByCurrentUser = currentUser && post.author
        // Periksa apakah ID penulis post ada dalam daftar following currentUser
        ? (currentUser.following || []).some(
            (followedUser) => String(followedUser.id) === String(post.author.id)
          )
        : false;

      // Kembalikan objek baru yang berisi data post + status like
      return {
        ...post,
        isLikedByCurrentUser: isLikedByCurrentUser,
        isAuthorFollowedByCurrentUser: isAuthorFollowedByCurrentUser,
        // alias yang lebih singkat/umum untuk penggunaan di view
        isFollowing: isAuthorFollowedByCurrentUser,
      };
    });

    this.viewService.render(res, 'pages/home', {
      pageTitle: 'Timeline',
      pesan: pesanSelamatDatang,
      user: currentUser,
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

  @Get('/search') // <-- Endpoint baru untuk halaman pencarian
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  public async search(
    @Query('q') q: string, // Ambil query string 'q' dari URL
    @Query('page', new ParseIntPipe({ optional: true })) page: number, // Opsional untuk pagination
    @Res() res: Response,
    @Request() req,
  ) {
    const searchQuery = q ? String(q).trim() : '';

    let currentUser: User | null = null;
    if (req.user) {
      // Ambil data user yang sedang login (termasuk relasi 'following')
      currentUser = await this.usersService.findById(req.user.id);
    }

    // Hanya tampilkan hasil jika ada query pencarian
    // 👇 PERBAIKAN: Berikan tipe eksplisit untuk menghindari inferensi 'never[]'
    let users: User[] = [];
    let posts: Post[] = [];
    // 👆 PERBAIKAN

    if (searchQuery) {
      // 1. Cari Pengguna (Users)
      const userFilterOptions: FilterUserDto = {
        search: searchQuery, // Menggunakan properti 'search' yang baru kita tambahkan
        roles: undefined, 
      };

      users = await this.usersService.findManyWithPagination({
        filterOptions: userFilterOptions,
        paginationOptions: { page: 1, limit: 10 }, // Batasi 10 hasil pengguna teratas
        sortOptions: [{ orderBy: 'firstName', order: 'ASC' }],
      });

      // 2. Cari Postingan (Posts)
      const postFilterOptions = {
        search: searchQuery, // Menggunakan properti 'search' yang baru kita tambahkan
        page: page || 1, 
        limit: 10,
      };

      // Ambil postingan mentah
      const rawPosts = await this.postsService.findAll({
        filterOptions: postFilterOptions,
        paginationOptions: { page: postFilterOptions.page, limit: postFilterOptions.limit },
        currentUser: currentUser,
      });

      // Proses data post untuk HBS (tambahkan isLikedByCurrentUser & isAuthorFollowedByCurrentUser)
      posts = rawPosts.map(post => {
        // Cek apakah 'currentUser' (jika ada) ada di dalam array post.likedBy
        const isLikedByCurrentUser = currentUser
          ? (post.likedBy || []).some(user => user.id === currentUser.id)
          : false;
        
        // Periksa apakah ID penulis post ada dalam daftar following currentUser
        const isAuthorFollowedByCurrentUser = currentUser && post.author
          ? (currentUser.following || []).some(
              (followedUser) => String(followedUser.id) === String(post.author.id)
            )
          : false;

        // Kembalikan objek baru yang berisi data post + status like & follow
        return {
          ...post,
          isLikedByCurrentUser: isLikedByCurrentUser,
          isAuthorFollowedByCurrentUser: isAuthorFollowedByCurrentUser,
          // alias yang lebih singkat/umum untuk penggunaan di view
          isFollowing: isAuthorFollowedByCurrentUser,
        };
      });
    }

    this.viewService.render(res, 'pages/search-results', {
      pageTitle: searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Pencarian',
      user: currentUser,
      searchQuery: searchQuery,
      users: users,
      posts: posts,
    });
  }

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

  @Get('users/:id/profile')
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  public async userProfile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Request() req,
  ) {
    let currentUser: User | null = null;
    if (req.user) {
      // Ambil data user yang sedang login (termasuk relasi 'following')
      currentUser = await this.usersService.findById(req.user.id);
    }

    // Ambil data user yang profilnya ingin dilihat
    const profileUser = await this.usersService.findById(id);

    if (!profileUser) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    // 1. Ambil postingan mentah dari user profil ini
    const rawPosts = await this.postsService.findAll({
      paginationOptions: { page: 1, limit: 20 },  
      authorId: id, // Filter berdasarkan ID user profil
      currentUser: currentUser, // Penting untuk memuat relasi likedBy
    });

    // 2. Proses data post untuk menambahkan status like oleh currentUser
    const posts = rawPosts.map(post => {
      // Cek apakah 'currentUser' (jika ada) ada di dalam array post.likedBy
      const isLikedByCurrentUser = currentUser
        ? (post.likedBy || []).some(user => user.id === currentUser.id)
        : false;

      // Periksa apakah penulis post di-follow oleh currentUser
      const isAuthorFollowedByCurrentUser = currentUser && post.author
        ? (currentUser.following || []).some(
            (followedUser) => String(followedUser.id) === String(post.author.id)
          )
        : false;

      // Kembalikan objek baru yang berisi data post + status like & follow
      return {
        ...post,
        isLikedByCurrentUser: isLikedByCurrentUser, // <-- DIBUTUHKAN OLEH _post-item.hbs
        isAuthorFollowedByCurrentUser: isAuthorFollowedByCurrentUser,
        isFollowing: isAuthorFollowedByCurrentUser,
      };
    });

    // 3. Ambil data follower/following untuk stats
    const followersCount = profileUser.followers?.length ?? 0;
    const followingCount = profileUser.following?.length ?? 0;
    const isFollowing = currentUser?.following?.some(u => u.id === profileUser.id) ?? false;


    this.viewService.render(res, 'pages/profile', {
      pageTitle: `Profil ${profileUser.firstName}`,
      user: currentUser, // Data user yang sedang login (bisa null)
      profileUser: profileUser, // Data user yang profilnya dilihat
      posts: posts, // Postingan milik profileUser yang sudah diproses
      isFollowing: isFollowing,
      followersCount: followersCount,
      followingCount: followingCount,
    })
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
