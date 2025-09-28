import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
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
