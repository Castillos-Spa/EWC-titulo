import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from './guards/roles.guard';
import { RegisterDto } from './dtos/register.dto';
import { OptionalAuth } from './decorators/optional-auth.decorator';
import type { Request as ExpressRequest } from 'express';
import type { AuthSession } from './auth.service';

type AuthenticatedRequest = ExpressRequest & { user: AuthSession };
type JwtRequestUser = { userId: number } & Record<string, unknown>;
type MaybeAuthenticatedRequest = ExpressRequest & { user?: AuthSession | JwtRequestUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @OptionalAuth()
  async logout(@Request() req: MaybeAuthenticatedRequest) {
    const userId = req.user?.userId;
    if (userId) {
      // req.user contiene el payload del JWT validado por el guard global
      await this.authService.logout(userId);
    }
    return { message: 'Se ha cerrado la sesión con éxito' };
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() { refreshToken }: { refreshToken: string }) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Get('profile')
  getProfile(@Request() req: MaybeAuthenticatedRequest) {
    return req.user;
  }

  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
