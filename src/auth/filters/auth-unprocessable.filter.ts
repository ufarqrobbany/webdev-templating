import { ExceptionFilter, Catch, ArgumentsHost, UnprocessableEntityException } from '@nestjs/common';
import { Response, Request } from 'express';
import { ViewService } from '../../core/view/view.service';

@Catch(UnprocessableEntityException)
export class AuthUnprocessableFilter implements ExceptionFilter {
  constructor(private readonly viewService: ViewService) {}

  catch(exception: UnprocessableEntityException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // Extract raw payload produced by ValidationPipe or manually thrown exception
    const raw = exception.getResponse() as any;
    const errors = raw?.errors || raw?.message || raw;

    // Decide which page we are on
    const url = req.originalUrl || req.url || '';
    const isRegister = url.includes('/auth/email/register');
    const isLogin = url.includes('/auth/email/login');

    if (!isRegister && !isLogin) {
      // Not our concern; fallback to JSON
      return res.status(422).json(raw);
    }

    // Build user-friendly message (single summary) + optionally field-level map
    let summary = 'Terjadi kesalahan. Periksa data yang dimasukkan.';
    if (isLogin) {
      summary = 'Login gagal. Periksa email & password.';
    } else if (isRegister) {
      summary = 'Registrasi gagal. Periksa data yang dimasukkan.';
    }

    if (errors) {
      // When ValidationPipe returns array of strings
      if (Array.isArray(errors)) {
        const msg = errors.join(' ');
        if (/password must be longer/i.test(msg)) {
          summary = 'Password harus minimal 6 karakter.';
        }
        if (/email must be an email/i.test(msg)) {
          summary = 'Format email tidak valid.';
        }
      } else if (typeof errors === 'object') {
        // Custom codes thrown by service
        if (errors.password && /longer than or equal to 6/i.test(errors.password)) {
          summary = 'Password harus minimal 6 karakter.';
        } else if (errors.email === 'notFound') {
          summary = 'Email tidak terdaftar.';
        } else if (typeof errors.email === 'string' && errors.email.startsWith('needLoginViaProvider:')) {
          summary = `Silakan login via penyedia: ${errors.email.split(':')[1]}.`;
        } else if (errors.password === 'incorrectPassword') {
          summary = 'Password salah.';
        }
      } else if (typeof errors === 'string') {
        if (/password must be longer/i.test(errors)) {
          summary = 'Password harus minimal 6 karakter.';
        }
      }
    }

    const layout = this.viewService.resolveViewPath('layouts/auth', false);
    const template = isRegister ? 'pages/register' : 'pages/login';
    // Refill fields (avoid password)
    const data: Record<string, any> = {
      pageTitle: isRegister ? 'Register' : 'Login',
      layout,
      errorMessage: summary,
      email: (req.body?.email as string) || '',
    };
    if (isRegister) {
      data.firstName = (req.body?.firstName as string) || '';
      data.lastName = (req.body?.lastName as string) || '';
    }

    return this.viewService.render(res, template, data);
  }
}