import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { NotificationController } from '@/features/notification/notification.controller';
import { NotificationService } from '@/features/notification/notification.service';
import { NotificationGateway } from '@/features/notification/notification.gateway';
import { PrismaService } from 'prisma/prisma.service';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Role } from '@prisma/client';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let currentUser: any;

  const notifications: any[] = [];
  const readByUser = new Map<string, boolean>();

  const users = new Map<number, any>([
    [
      1,
      {
        id: 1,
        userId: 1,
        roleAssignments: [{ role: Role.Admin, area: 'Transporte', isActive: true }],
      },
    ],
    [
      2,
      {
        id: 2,
        userId: 2,
        roleAssignments: [{ role: Role.Supervisor, area: 'Transporte', isActive: true }],
      },
    ],
  ]);

  const prismaStub = {
    notification: {
      create: jest.fn(async ({ data }: any) => {
        const entity = { id: notifications.length + 1, ...data };
        notifications.push(entity);
        return entity;
      }),
      findUnique: jest.fn(async ({ where: { id }, include }: any) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return null;
        return {
          ...notification,
          ...(include?.readBy
            ? {
                readBy: readByUser.get(`${currentUser.id}-${notification.id}`)
                  ? [{ userId: currentUser.id, read: true }]
                  : [],
              }
            : {}),
          ...(include?.createdBy ? { createdBy: { username: 'admin' } } : {}),
        };
      }),
      findMany: jest.fn(async (options: any) => {
        const { skip = 0, take = notifications.length, include } = options;
        return notifications.slice(skip, skip + take).map(notification => ({
          ...notification,
          ...(include?.createdBy ? { createdBy: { username: 'admin' } } : {}),
          readBy: readByUser.get(`${currentUser.id}-${notification.id}`)
            ? [{ userId: currentUser.id, read: true }]
            : [],
        }));
      }),
      count: jest.fn(async () => notifications.length),
      update: jest.fn(async ({ where: { id }, data }: any) => {
        const index = notifications.findIndex(n => n.id === id);
        if (index >= 0) {
          notifications[index] = { ...notifications[index], ...data };
          return notifications[index];
        }
        return null;
      }),
    },
    user: {
      findUnique: jest.fn(async ({ where: { id } }: any) => users.get(id) || null),
    },
    userNotification: {
      upsert: jest.fn(async ({ where: { userId_notificationId }, create }: any) => {
        if (create) {
          readByUser.set(`${create.userId}-${create.notificationId}`, true);
        } else if (userId_notificationId) {
          readByUser.set(`${userId_notificationId.userId}-${userId_notificationId.notificationId}`, true);
        }
        return { read: true };
      }),
    },
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(prismaStub);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return null;
    }),
  } as unknown as PrismaService;

  const gatewayStub = { sendNotification: jest.fn() } as unknown as NotificationGateway;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationService,
        { provide: NotificationGateway, useValue: gatewayStub },
        { provide: PrismaService, useValue: prismaStub },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = currentUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    currentUser = users.get(1);
  });

  it('creates a custom notification as admin', async () => {
    const response = await request(app.getHttpServer())
      .post('/notification')
      .send({ title: 'Update', message: 'Check system', target: { scope: 'areas', areas: ['Transporte'] } });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({ title: 'Update' }));
    expect(gatewayStub.sendNotification).toHaveBeenCalled();
  });

  it('lists notifications for a supervisor and marks as read', async () => {
    currentUser = users.get(2);

    const listResponse = await request(app.getHttpServer()).get('/notification');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);

    const notificationId = listResponse.body.items[0].id;

    const readResponse = await request(app.getHttpServer())
      .patch(`/notification/${notificationId}`)
      .send({ read: true });

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.readBy[0]).toEqual(expect.objectContaining({ userId: 2, read: true }));
  });
});
