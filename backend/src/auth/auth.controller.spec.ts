import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Role, Permission } from '@prisma/client';
import { RegisterDto } from './dtos/register.dto';

// Mocks
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

const mockLocalAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockRolesGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockPermissionsGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería llamar a authService.login con el usuario correcto', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        roles: [Role.Admin],
        permissions: [Permission.VIEW_ROUTES],
      };

      const mockRequest = { user: mockUser };
      const mockResult = { access_token: 'test-token' };

      jest.spyOn(authService, 'login').mockResolvedValue(mockResult);

      const result = await controller.login(mockRequest);

      expect(result).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('logout', () => {
    it('debería retornar un mensaje de éxito', async () => {
      const result = await controller.logout();

      expect(result).toEqual({ message: 'Se ha cerrado la sesión con éxito' });
    });
  });

  describe('getProfile', () => {
    it('debería retornar el usuario de la request', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        roles: [Role.Admin],
        permissions: [Permission.VIEW_ROUTES],
      };

      const mockRequest = { user: mockUser };

      const result = controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('debería llamar a authService.register con el DTO correcto', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        area: 'Administración',
      };

      const mockUser = {
        id: 1,
        ...registerDto,
        roles: [Role.Admin],
        permissions: [Permission.VIEW_ROUTES],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });
});
