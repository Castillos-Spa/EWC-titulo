import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
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
    // El objeto que se retorna aquí es lo que se inyectará en `req.user`
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      areas: payload.areas,
      roles: payload.roles,
      permissions: payload.permissions,
      rolesByArea: payload.rolesByArea,
      isAdmin: payload.isAdmin,
      active: payload.active,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}
