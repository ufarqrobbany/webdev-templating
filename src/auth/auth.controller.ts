import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  Post,
  UseGuards,
  Patch,
  Delete,
  SerializeOptions,
  Res, // <-- 1. TAMBAH @Res
} from '@nestjs/common';
import { Response } from 'express'; // <-- 2. TAMBAH Response
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

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly service: AuthService) {} // Tetap pakai 'service'

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('email/login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  // 3. Modifikasi: Tambah @Res, return jadi Promise<void>
  public async login(
    @Body() loginDto: AuthEmailLoginDto,
    @Res() res: Response,
  ): Promise<void> {
    const loginResponse = await this.service.validateLogin(loginDto);

    // 4. Tambah Set Cookie
    res.cookie('accessToken', loginResponse.token, {
      httpOnly: true,
      secure: false, // Ganti true jika HTTPS
      path: '/',
      expires: new Date(loginResponse.tokenExpires),
    });
    res.cookie('refreshToken', loginResponse.refreshToken, {
      httpOnly: true,
      secure: false, // Ganti true jika HTTPS
      path: '/',
      // Biasanya refresh token lebih lama, tapi boilerplate ini tidak mengembalikan expiry-nya
    });

    // 5. Tambah Redirect
    return res.redirect('/');
  }

  @Post('email/register')
  @HttpCode(HttpStatus.CREATED) // Ganti ke CREATED biar lebih pas
  // 6. Modifikasi: Tambah @Res
  async register(
    @Body() createUserDto: AuthRegisterLoginDto,
    @Res() res: Response,
  ): Promise<void> {
    // Panggil register (hanya buat user, return void)
    await this.service.register(createUserDto);

    // 7. Tambah: Langsung login setelah register
    const loginResponse = await this.service.validateLogin({
      email: createUserDto.email,
      password: createUserDto.password,
    });

    // 8. Tambah Set Cookie (sama kayak login)
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

    // 9. Tambah Redirect
    return res.redirect('/');
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return this.service.confirmEmail(confirmEmailDto.hash);
  }

  // Endpoint ini ada di kode asli lo, jadi biarin aja
  @Post('email/confirm/new')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmNewEmail(
    @Body() confirmEmailDto: AuthConfirmEmailDto, // DTO nya mungkin salah, tapi ikutin asli
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
    type: User, // Di kode asli type: User
  })
  @HttpCode(HttpStatus.OK)
  public me(@Request() request): Promise<NullableType<User>> {
    // Parameter di kode asli 'request.user', bukan 'request.user.id'
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
  // 10. Modifikasi: Tambah @Res({ passthrough: true }) biar bisa set cookie & return data
  public async refresh(
    @Request() request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const refreshResponse = await this.service.refreshToken({
      sessionId: request.user.sessionId,
      hash: request.user.hash, // Di kode asli pake hash
    });

    // 11. Tambah Set Cookie accessToken baru
    res.cookie('accessToken', refreshResponse.token, {
      httpOnly: true,
      secure: false,
      path: '/',
      expires: new Date(refreshResponse.tokenExpires),
    });

    return refreshResponse; // Tetap return data refresh token
  }

  @ApiBearerAuth()
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK) // Ganti ke OK
  // 12. Modifikasi: Tambah @Res
  public async logout(@Request() request, @Res() res: Response): Promise<void> {
    await this.service.logout({
      sessionId: request.user.sessionId,
    });

    // 13. Tambah Clear Cookie
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    // 14. Tambah Redirect ke login
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
    type: User, // Di kode asli type: User
  })
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    // Parameter di kode asli 'request.user', bukan 'request.user.id'
    return this.service.update(request.user, userDto);
  }

  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    // Parameter di kode asli 'request.user', bukan 'request.user.id'
    return this.service.softDelete(request.user);
  }
}
