import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Render,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
// (Optional) Keep import available if we later decorate endpoints
// import { UseFilters } from '@nestjs/common';
// import { AuthUnprocessableFilter } from './filters/auth-unprocessable.filter';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { User } from '../users/domain/user';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { UsersService } from '../users/users.service'; // <-- Import sudah benar

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly usersService: UsersService, // <-- Inject sudah benar
  ) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public async login(
    @Body() loginDto: AuthEmailLoginDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const loginResponse = await this.service.validateLogin(loginDto);

      res.cookie('accessToken', loginResponse.token, {
        httpOnly: true,
        secure: false,
        path: '/',
        expires: new Date(loginResponse.tokenExpires),
      });
      res.cookie('refreshToken', loginResponse.refreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
      });

      return res.redirect('/');
    } catch (err: any) {
      // Tangani kegagalan login: tetap di halaman login
      let userFriendly = 'Login gagal. Periksa email & password.';
      const resp = err?.response;
      const errors = resp?.errors;
      if (errors) {
        if (errors.email === 'notFound') {
          userFriendly = 'Email tidak terdaftar.';
        } else if (
          typeof errors.email === 'string' &&
          errors.email.startsWith('needLoginViaProvider:')
        ) {
          const provider = errors.email.split(':')[1];
          userFriendly = `Silakan login via penyedia: ${provider}.`;
        } else if (errors.password === 'incorrectPassword') {
          userFriendly = 'Password salah.';
        } else if (
          typeof errors.password === 'string' &&
          /longer than or equal to 6/i.test(errors.password)
        ) {
          userFriendly = 'Password harus minimal 6 karakter.';
        }
      }
      return res.status(HttpStatus.UNAUTHORIZED).render(
        'default/views/pages/login',
        {
          pageTitle: 'Login',
          errorMessage: userFriendly,
          email: loginDto.email,
          layout: 'default/views/layouts/auth',
        },
      );
    }
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.service.register(createUserDto);
      const loginResponse = await this.service.validateLogin({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      res.cookie('accessToken', loginResponse.token, {
        httpOnly: true,
        secure: false,
        path: '/',
        expires: new Date(loginResponse.tokenExpires),
      });
      res.cookie('refreshToken', loginResponse.refreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
      });

      return res.redirect('/');
    } catch (err: any) {
      // Map beberapa error umum jadi pesan lebih ramah
      let userFriendly = 'Registrasi gagal. Periksa data yang dimasukkan.';
      const resp = err?.response;
      const errors = resp?.errors;
      if (errors) {
        // Contoh: validasi email sudah digunakan, dll. (sesuaikan bila ada kode error spesifik)
        if (errors.email === 'emailTaken') {
          userFriendly = 'Email sudah terdaftar.';
        }
      }
      return res.status(HttpStatus.BAD_REQUEST).render(
        'default/views/pages/register',
        {
          pageTitle: 'Register',
          errorMessage: userFriendly,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          layout: 'default/views/layouts/auth',
        },
      );
    }
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  @Post('email/confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmNewEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmNewEmail(confirmEmailDto.hash);
  }

  @Post('forgot/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.service.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.service.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({
    type: User,
  })
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<NullableType<User>> {
    return this.service.me(request.user);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  public async refresh(
    @Request() request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshResponse = await this.service.refreshToken({
      sessionId: request.user.sessionId,
      hash: request.user.hash,
    });

    res.cookie('accessToken', refreshResponse.token, {
      httpOnly: true,
      secure: false,
      path: '/',
      expires: new Date(refreshResponse.tokenExpires),
    });

    return refreshResponse;
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  public async logout(@Request() request, @Res() res: Response): Promise<void> {
    await this.service.logout({
      sessionId: request.user.sessionId,
    });

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return res.redirect('/login');
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: User,
  })
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    return this.service.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    return this.service.softDelete(request.user);
  }

  // ==========================================================
  // 👇 METHOD BARU UNTUK UI/VIEW 👇
  // ==========================================================

  @Get('profile/edit')
  @UseGuards(AuthGuard('jwt'))
  @Render('default/views/pages/profile-edit')
  async getProfileEditPage(@Request() req) {
    const fullUser = await this.usersService.findById(req.user.id);

    return {
      user: fullUser,
      title: 'Edit Profil',
    };
  }

  @Post('profile')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updateProfileForm(
    @Request() req,
    @Body() dto: AuthUpdateDto,
    @Res() res: Response,
  ) {
    await this.service.update(req.user, dto);
    return res.redirect(`/users/${req.user.id}/profile`);
  }

  /**
   * Menampilkan halaman profil utama
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @Render('default/views/pages/profile')
  async getProfile(@Request() req) {
    // ==========================================================
    // 👇 INI PERBAIKANNYA 👇
    // ==========================================================
    // Gunakan 'findById' (sesuai users.service.ts) bukan 'findOne'
    const profileUser = await this.usersService.findById(req.user.id);

    if (!profileUser) {
      // Data fallback jika user tidak ditemukan (meskipun seharusnya tidak terjadi)
      return {
        user: req.user,
        profileUser: req.user,
        posts: [],
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
      };
    }

    // TODO: Implementasikan logika follower jika Anda sudah punya service-nya
    const followersCount = profileUser.followers?.length || 0; //
    const followingCount = profileUser.following?.length || 0; //

    return {
      user: req.user, // User yang sedang login
      profileUser: profileUser, // Data lengkap user
      posts: profileUser.posts || [], // 'posts' sekarang aman diakses
      followersCount,
      followingCount,
      isFollowing: false,
    };
  }
}
