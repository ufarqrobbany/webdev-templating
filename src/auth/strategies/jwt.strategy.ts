import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrNeverType } from '../../utils/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import { Request } from 'express';

// Fungsi ini akan ngambil token 'accessToken' dari cookie
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['accessToken'] || null;
  }
  return null;
};

// 👇 BUAT TYPE BARU UNTUK req.user 👇
type UserPayload = {
  id: JwtPayloadType['id'];
  role: JwtPayloadType['role'];
  sessionId: JwtPayloadType['sessionId'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor, // Pertama, coba baca dari cookie
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Kalo gagal, baru cari di header
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  // 👇 GANTI RETURN TYPE DI SINI 👇
  public validate(payload: JwtPayloadType): OrNeverType<UserPayload> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    // Objek yang dibalikin udah bener
    return {
      id: payload.id,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
