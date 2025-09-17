import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  // Segun passport en nestJS
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Compara la contraseña usando bcrypt - CORREGIDO
    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (isPasswordValid) {
      // Usar desestructuración para excluir la propiedad password
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      area: user.area,
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword,
      active: user.active,
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: '5m' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.usersService.setRefreshToken(user.id, hashedRefreshToken);

    return { access_token, refresh_token };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);
    return user;
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.active || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const isRefreshTokenMatching = await bcrypt.compare(token, user.refreshToken);

      if (!isRefreshTokenMatching) {
        throw new UnauthorizedException('Access Denied');
      }

      // El usuario es válido, se crea un nuevo access token con datos actualizados
      const newPayload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        area: user.area,
        permissions: user.permissions,
        mustChangePassword: user.mustChangePassword,
        active: user.active,
      };

      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '5m' });

      return { access_token: newAccessToken };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e; // Re-lanzar la excepción específica si ya es del tipo correcto
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
