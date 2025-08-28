import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { Role, Permission } from '@prisma/client';

// Mock de las dependencias
jest.mock('bcrypt');
jest.mock('../users/users.service');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('debería retornar usuario sin password cuando las credenciales son válidas', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: 'Administración',
        password: 'hashedPassword',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('john@example.com', 'admin123');

      expect(result).toEqual({
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: 'Administración',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', 'hashedPassword');
    });

    it('debería retornar null cuando el usuario no existe', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await authService.validateUser('notfound@example.com', 'password123');

      expect(result).toBeNull();
      expect(usersService.findByEmail).toHaveBeenCalledWith('notfound@example.com');
    });

    it('debería retornar null cuando la contraseña es incorrecta', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: 'Administración',
        password: 'hashedPassword',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });

  describe('login', () => {
    it('debería retornar un access_token con payload correcto', async () => {
      const mockUser = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        area: 'Administración',
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockToken = 'jwtToken';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await authService.login(mockUser);

      expect(result).toEqual({ access_token: 'jwtToken' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'john@example.com',
        sub: 1,
        roles: [Role.Admin],
        permissions: Object.values(Permission),
      });
    });
  });

  describe('register', () => {
    it('debería registrar usuario llamando al usersService', async () => {
      const registerDto: RegisterDto = {
        username: 'john',
        email: 'john@example.com',
        password: 'admin123',
        area: 'Administración',
      };

      const mockUser = {
        id: 1,
        ...registerDto,
        roles: [Role.Admin],
        permissions: Object.values(Permission),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'register').mockResolvedValue(mockUser);

      const result = await authService.register(registerDto);

      expect(result).toEqual(mockUser);
      expect(usersService.register).toHaveBeenCalledWith(registerDto);
    });
  });
});
