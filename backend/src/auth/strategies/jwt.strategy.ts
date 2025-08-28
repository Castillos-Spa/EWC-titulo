import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    //Validar que el payload tenga los campos requeridos
    if (!payload || typeof payload !== 'object') {
      throw new UnauthorizedException('Token inválido: payload incorrecto');
    }
    if (!payload.sub) {
      throw new UnauthorizedException('Token invalido: falta user ID');
    }

    if (!payload.email) {
      throw new UnauthorizedException('Token invalido: falta email');
    }
    return { userId: payload.sub, email: payload.email, roles: payload.roles, permissions: payload.permissions };
  }
}
