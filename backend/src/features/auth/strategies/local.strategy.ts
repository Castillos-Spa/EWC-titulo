import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(req: Request, email: string, password: string): Promise<any> {
    const tenantSlug = (req.body?.tenantSlug || req.body?.tenant || req.body?.tenantId)?.toString();
    const companyIdRaw = req.body?.companyId;
    const companyId =
      companyIdRaw !== undefined && companyIdRaw !== null && companyIdRaw !== '' ? Number(companyIdRaw) : undefined;

    const session = await this.authService.validateUser(email, password, tenantSlug, companyId);
    if (!session) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return session;
  }
}
