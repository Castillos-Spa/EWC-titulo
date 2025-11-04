import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import { AuthController } from '@/features/auth/auth.controller';
import { AuthService } from '@/features/auth/auth.service';
import { UsersService } from '@/features/users/users.service';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from '@/features/auth/guards/local-auth.guard';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const stored: { refreshTokenHash?: string } = {};
  let issuedRefreshToken = '';

  const mockUser = {
    id: 1,
    email: 'demo@example.com',
    username: 'demo',
    mustChangePassword: false,
    active: true,
    roleAssignments: [{ area: 'Transporte', role: 'Admin', permissions: [], isActive: true }],
  } as any;

  const usersService = {
    setRefreshToken: jest.fn(async (_id: number, hash: string | null) => {
      stored.refreshTokenHash = hash ?? undefined;
    }),
    updateLastLogin: jest.fn(),
    findById: jest.fn(async () => ({ ...mockUser, refreshToken: stored.refreshTokenHash, password: 'hashed' })),
  } as unknown as jest.Mocked<UsersService>;

  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        REFRESH_TOKEN_SECRET: 'refresh-hmac',
      };
      return values[key];
    }),
  } as unknown as jest.Mocked<ConfigService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } })],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in and returns tokens', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ email: 'demo', password: 'secret' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        user: expect.objectContaining({ username: 'demo' }),
      }),
    );
    expect(usersService.setRefreshToken).toHaveBeenCalledWith(1, expect.any(String));
    issuedRefreshToken = response.body.refresh_token;
  });

  it('refreshes token with stored hash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: issuedRefreshToken });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        access_token: expect.any(String),
        user: expect.objectContaining({ id: 1 }),
      }),
    );
  });

  it('logs out gracefully', async () => {
    const response = await request(app.getHttpServer()).post('/auth/logout');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Se ha cerrado la sesión con éxito' });
  });
});
