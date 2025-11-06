import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { NotificationService } from '@/features/notification/notification.service';
import { CacheService } from '@/common/cache.service';
import { createPrismaMock, PrismaMock } from '../../../test/utils/mock-prisma';
import { Role, Permission, Area } from '@prisma/client';
import { TenantContextService } from '@/app/core/tenant-context.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaMock;
  const notificationService = {
    createNotification: jest.fn(),
  } as unknown as jest.Mocked<NotificationService>;
  const cacheService = {
    del: jest.fn(),
    delPrefix: jest.fn(),
  } as unknown as jest.Mocked<CacheService>;
  const tenantContext = {
    get tenantId() {
      return 77;
    },
  } as unknown as TenantContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = createPrismaMock();
    service = new UsersService(notificationService, prisma as any, cacheService, tenantContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates user with temp password when missing and notifies admins', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-temp');

      const createdUser = {
        id: 1,
        username: 'newuser',
        email: 'user@example.com',
        password: 'hashed-temp',
        mustChangePassword: true,
        active: true,
        roleAssignments: [],
      } as any;

      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(prisma));
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(createdUser);
      (prisma.userRoleAssignment.createMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        ...createdUser,
        tenant: { id: 77, slug: 'tenant-1' },
        userCompanies: [],
        roleAssignments: [],
      });

      const result = await service.register({
        username: 'newuser',
        email: 'user@example.com',
        password: '',
        roleAssignments: [],
      } as any);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nuevo Usuario Creado',
          type: 'user_created',
        }),
      );
      expect(cacheService.del).toHaveBeenCalledWith('users_total');
      expect(cacheService.delPrefix).toHaveBeenCalledWith('cache:GET:/users');
      expect(result.tempPassword).toHaveLength(10);
    });
  });

  describe('findAll', () => {
    it('returns paginated users with derived fields', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([
        [
          {
            id: 1,
            username: 'tester',
            email: 'tester@example.com',
            active: true,
            lastLogin: null,
            roleAssignments: [
              {
                id: 10,
                area: 'Transporte' as Area,
                role: 'Admin' as Role,
                specialty: null,
                permissions: ['read' as Permission],
                isActive: true,
              },
            ],
          },
        ],
        1,
      ]);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          total: 1,
          items: [
            expect.objectContaining({
              id: 1,
              roles: ['Admin'],
              areas: ['Transporte'],
              isAdmin: true,
            }),
          ],
        }),
      );
    });
  });

  describe('deleteUser', () => {
    it('prevents deleting self', async () => {
      await expect(service.deleteUser(1, 1)).rejects.toThrow('No puedes eliminar tu propio usuario.');
    });

    it('deletes user and related notifications', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(prisma));
      (prisma.notification.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
      (prisma.user.delete as jest.Mock).mockResolvedValueOnce({ success: true });

      const result = await service.deleteUser(2, 1);

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({ where: { createdById: 2 } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(result).toEqual({ success: true });
    });
  });

  describe('changePassword', () => {
    it('throws when current password mismatches', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, password: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.changePassword(1, 'wrong', 'new')).rejects.toThrow('La contraseña actual es incorrecta');
    });
  });
});
