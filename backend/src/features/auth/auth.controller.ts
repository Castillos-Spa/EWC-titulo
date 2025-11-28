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
import { RequirePermissions } from './decorators/permissions.decorator';
import { Role, Permission } from '@prisma/client';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RegisterDto } from './dtos/register.dto';
import { OptionalAuth } from './decorators/optional-auth.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @OptionalAuth()
  async logout(@Request() req) {
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
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
