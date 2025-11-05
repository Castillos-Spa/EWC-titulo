import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import { AuthController } from '@/features/auth/auth.controller';
import { AuthService } from '@/features/auth/auth.service';
import { UsersController } from '@/features/users/users.controller';
import { UsersService } from '@/features/users/users.service';
import { DashboardController } from '@/features/dashboard/dashboard.controller';
import { DashboardService } from '@/features/dashboard/dashboard.service';
import { RoutesController } from '@/features/routes/routes.controller';
import { RoutesService } from '@/features/routes/routes.service';
import { WorkshopController } from '@/features/workshop/workshop.controller';
import { WorkshopService } from '@/features/workshop/workshop.service';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from '@/features/auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/features/auth/guards/permissions.guard';
import { WorkOrderStatus } from '@/features/work-order/work-order.service';
import { SimpleCacheInterceptor } from 'src/common/simple-cache.interceptor';

interface StoredUser {
  id: number;
  username: string;
  email: string;
  password: string;
  mustChangePassword: boolean;
  active: boolean;
  roleAssignments: Array<{
    area: string;
    role: string;
    specialty?: string | null;
    permissions: string[];
    isActive: boolean;
  }>;
  refreshToken?: string | null;
  lastLogin?: Date | null;
}

describe('Integrated Journeys (e2e)', () => {
  let app: INestApplication | undefined;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let issuedAccessToken = '';
  let activeUserId = 0;
  let lastAuthorizationHeader: string | undefined;

  const usersStore: StoredUser[] = [];
  const routesStore: Array<{
    id: number;
    code: string;
    origin: string;
    destination: string;
    distanceKm: number;
    frequency: string;
    active: boolean;
  }> = [];
  const assignmentsStore: Array<{
    id: number;
    routeId: number;
    truckId: number;
    driverId: number;
    date: string;
    status: string;
    volumeLiters?: number;
  }> = [];
  const workOrdersStore: Array<{
    id: number;
    vehiculoId: number;
    tipo: string;
    description: string;
    repuestos?: string[];
    responsableId?: number;
    estado: WorkOrderStatus;
  }> = [];

  const sanitizeUser = (user: StoredUser) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    roleAssignments: user.roleAssignments,
    refreshToken: user.refreshToken ?? null,
  });

  const usersService = {
    register: jest.fn(async (dto: any) => {
      const id = usersStore.length + 1;
      const hasPassword = typeof dto.password === 'string' && dto.password.length > 0;
      const password = hasPassword ? dto.password : `TempPass-${id}`;
      const roleAssignments = dto.roleAssignments.map((assignment: any) => ({
        area: assignment.area,
        role: assignment.role,
        specialty: assignment.specialty ?? null,
        permissions: assignment.additionalPermissions ?? [],
        isActive: true,
      }));
      const stored: StoredUser = {
        id,
        username: dto.username,
        email: dto.email,
        password,
        mustChangePassword: !hasPassword,
        active: dto.active ?? true,
        roleAssignments,
        refreshToken: null,
        lastLogin: null,
      };
      usersStore.push(stored);
      return {
        user: sanitizeUser(stored),
        tempPassword: stored.mustChangePassword ? password : undefined,
      };
    }),
    findByEmail: jest.fn(async (email: string) => {
      const user = usersStore.find(candidate => candidate.email === email);
      return user ? { ...user } : null;
    }),
    findById: jest.fn(async (id: number) => {
      const user = usersStore.find(candidate => candidate.id === id);
      return user ? sanitizeUser(user) : null;
    }),
    setRefreshToken: jest.fn(async (userId: number, refreshToken: string | null) => {
      const user = usersStore.find(candidate => candidate.id === userId);
      if (user) {
        user.refreshToken = refreshToken;
      }
    }),
    updateLastLogin: jest.fn(async (userId: number) => {
      const user = usersStore.find(candidate => candidate.id === userId);
      if (user) {
        user.lastLogin = new Date();
      }
    }),
    findAll: jest.fn(async () => ({
      items: usersStore.map(candidate => sanitizeUser(candidate)),
      total: usersStore.length,
      page: 1,
      pageSize: usersStore.length || 1,
      totalPages: 1,
    })),
  } as unknown as jest.Mocked<UsersService>;

  const dashboardService = {
    getOverview: jest.fn(async (userId: number, query: any) => ({
      userId,
      modules: query.modules ?? [],
      widgets: { alerts: 1, workOrders: workOrdersStore.length },
    })),
  } as unknown as jest.Mocked<DashboardService>;

  const routesService = {
    create: jest.fn(async (dto: any) => {
      const route = {
        id: routesStore.length + 1,
        code: dto.code,
        origin: dto.origin,
        destination: dto.destination,
        distanceKm: dto.distanceKm,
        frequency: dto.frequency,
        active: dto.active ?? true,
      };
      routesStore.push(route);
      return route;
    }),
    findAll: jest.fn(async () => ({
      items: routesStore,
      total: routesStore.length,
      page: 1,
      pageSize: routesStore.length || 1,
      totalPages: 1,
    })),
    findOne: jest.fn(async (id: number) => routesStore.find(route => route.id === id) ?? null),
    update: jest.fn(async (id: number, dto: any) => {
      const route = routesStore.find(candidate => candidate.id === id);
      if (route) {
        Object.assign(route, dto);
      }
      return route ?? null;
    }),
    remove: jest.fn(async (id: number) => {
      const index = routesStore.findIndex(route => route.id === id);
      if (index >= 0) {
        return routesStore.splice(index, 1)[0];
      }
      return null;
    }),
    createAssignment: jest.fn(async (dto: any) => {
      const assignment = {
        id: assignmentsStore.length + 1,
        routeId: Number(dto.routeId),
        truckId: Number(dto.truckId),
        driverId: Number(dto.driverId),
        date: dto.date,
        status: dto.status ?? 'Planificada',
        volumeLiters: dto.volumeLiters,
      };
      assignmentsStore.push(assignment);
      return assignment;
    }),
    findAllAssignments: jest.fn(async () => ({
      items: assignmentsStore,
      total: assignmentsStore.length,
      page: 1,
      pageSize: assignmentsStore.length || 1,
      totalPages: 1,
    })),
    removeAssignment: jest.fn(async (id: number) => {
      const index = assignmentsStore.findIndex(assignment => assignment.id === id);
      if (index >= 0) {
        return assignmentsStore.splice(index, 1)[0];
      }
      return null;
    }),
  } as unknown as jest.Mocked<RoutesService>;

  const workshopService = {
    createWorkOrder: jest.fn(async (dto: any) => {
      const workOrder = {
        id: workOrdersStore.length + 1,
        vehiculoId: dto.vehiculoId,
        tipo: dto.tipo,
        description: dto.description,
        repuestos: dto.repuestos,
        responsableId: dto.responsableId,
        estado: WorkOrderStatus.OPEN,
      };
      workOrdersStore.push(workOrder);
      return workOrder;
    }),
    findAllWorkOrders: jest.fn(async () => ({
      items: workOrdersStore,
      total: workOrdersStore.length,
      page: 1,
      pageSize: workOrdersStore.length || 1,
      totalPages: 1,
    })),
    updateWorkOrderStatus: jest.fn(async (id: number, status: WorkOrderStatus) => {
      const workOrder = workOrdersStore.find(candidate => candidate.id === id);
      if (workOrder) {
        workOrder.estado = status;
      }
      return workOrder ?? null;
    }),
    closeWorkOrder: jest.fn(async (id: number, checklist: string, result: string) => {
      const workOrder = workOrdersStore.find(candidate => candidate.id === id);
      if (workOrder) {
        workOrder.estado = WorkOrderStatus.CLOSED;
      }
      return {
        id,
        checklist,
        resultado: result,
        otId: id,
        estado: WorkOrderStatus.CLOSED,
      };
    }),
    getOverview: jest.fn(async (query: any) => ({
      include: query.include,
      workOrders: {
        items: workOrdersStore,
        total: workOrdersStore.length,
        page: 1,
        pageSize: workOrdersStore.length || 1,
        totalPages: 1,
      },
    })),
  } as unknown as jest.Mocked<WorkshopService>;

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
      controllers: [UsersController, AuthController, DashboardController, RoutesController, WorkshopController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: RoutesService, useValue: routesService },
        { provide: WorkshopService, useValue: workshopService },
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const { email, password } = req.body;
          if (!email || !password) {
            throw new UnauthorizedException('Missing credentials');
          }
          const user = usersStore.find(candidate => candidate.email === email && candidate.password === password);
          if (!user) {
            throw new UnauthorizedException('Invalid credentials');
          }
          req.user = sanitizeUser(user);
          return true;
        },
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          lastAuthorizationHeader = req.headers['authorization'];
          if (!issuedAccessToken || lastAuthorizationHeader === `Bearer ${issuedAccessToken}`) {
            req.user = { userId: activeUserId, roles: ['Admin'], permissions: ['MANAGE_ROUTES'] };
            return true;
          }
          throw new UnauthorizedException('Invalid bearer token');
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(SimpleCacheInterceptor)
      .useValue({
        intercept: (_ctx: any, next: any) => next.handle(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    httpServer = app.getHttpServer();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('registers a user, logs in, and accesses the dashboard overview', async () => {
    const registerPayload = {
      username: 'transport.admin',
      email: 'transport.admin@example.com',
      roleAssignments: [
        {
          area: 'Transporte',
          role: 'Admin',
          additionalPermissions: ['MANAGE_ROUTES', 'VIEW_DASHBOARD'],
        },
      ],
    };

    const registerResponse = await request(httpServer).post('/users').send(registerPayload);

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ username: 'transport.admin', roleAssignments: expect.any(Array) }),
        tempPassword: expect.any(String),
      }),
    );

    const tempPassword: string = registerResponse.body.tempPassword;
    activeUserId = registerResponse.body.user.id;

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({ email: registerPayload.email, password: tempPassword });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        access_token: expect.any(String),
        refresh_token: expect.any(String),
        user: expect.objectContaining({ id: activeUserId, roles: expect.arrayContaining(['Admin']) }),
      }),
    );

    issuedAccessToken = loginResponse.body.access_token;

    const dashboardResponse = await request(httpServer)
      .get('/dashboard/overview?modules=transport,tickets')
      .set('Authorization', `Bearer ${issuedAccessToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body).toEqual(
      expect.objectContaining({
        userId: activeUserId,
        modules: expect.arrayContaining(['transport', 'tickets']),
      }),
    );
    expect(dashboardService.getOverview).toHaveBeenCalledWith(
      activeUserId,
      expect.objectContaining({ modules: expect.arrayContaining(['transport', 'tickets']) }),
    );
    expect(lastAuthorizationHeader).toBe(`Bearer ${issuedAccessToken}`);
  });

  it('creates, validates, and confirms a transport route assignment', async () => {
    expect(issuedAccessToken).toBeTruthy();

    const createRoutePayload = {
      code: 'R-100',
      origin: 'Planta Central',
      destination: 'Obra Norte',
      distanceKm: 128,
      frequency: 'Diaria',
    };

    const createRouteResponse = await request(httpServer)
      .post('/routes')
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send(createRoutePayload);

    expect(createRouteResponse.status).toBe(201);
    expect(createRouteResponse.body).toEqual(expect.objectContaining(createRoutePayload));

    const routeId = createRouteResponse.body.id;

    const getRouteResponse = await request(httpServer)
      .get(`/routes/${routeId}`)
      .set('Authorization', `Bearer ${issuedAccessToken}`);

    expect(getRouteResponse.status).toBe(200);
    expect(getRouteResponse.body).toEqual(expect.objectContaining({ id: routeId, code: 'R-100' }));

    const assignmentPayload = {
      routeId,
      truckId: 21,
      driverId: activeUserId,
      date: new Date().toISOString(),
      status: 'Confirmada',
      volumeLiters: 4500,
    };

    const assignmentResponse = await request(httpServer)
      .post('/routes/assignments')
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send(assignmentPayload);

    expect(assignmentResponse.status).toBe(201);
    expect(assignmentResponse.body).toEqual(
      expect.objectContaining({
        routeId,
        status: 'Confirmada',
      }),
    );

    const listAssignmentsResponse = await request(httpServer)
      .get('/routes/assignments')
      .set('Authorization', `Bearer ${issuedAccessToken}`);

    expect(listAssignmentsResponse.status).toBe(200);
    expect(listAssignmentsResponse.body.total).toBe(1);
    expect(listAssignmentsResponse.body.items[0]).toEqual(expect.objectContaining({ status: 'Confirmada' }));

    const updateRouteResponse = await request(httpServer)
      .patch(`/routes/${routeId}`)
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send({ active: true, frequency: 'Semanal' });

    expect(updateRouteResponse.status).toBe(200);
    expect(updateRouteResponse.body).toEqual(expect.objectContaining({ id: routeId, frequency: 'Semanal' }));
    expect(lastAuthorizationHeader).toBe(`Bearer ${issuedAccessToken}`);
  });

  it('creates a work order, assigns progress, and records closure', async () => {
    expect(issuedAccessToken).toBeTruthy();

    const workOrderPayload = {
      vehiculoId: 77,
      tipo: 'Preventivo',
      description: 'Inspección completa de seguridad',
      repuestos: ['Filtro de aceite'],
      responsableId: activeUserId,
    };

    const createWorkOrderResponse = await request(httpServer)
      .post('/workshop/work-orders')
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send(workOrderPayload);

    expect(createWorkOrderResponse.status).toBe(201);
    expect(createWorkOrderResponse.body).toEqual(
      expect.objectContaining({ estado: WorkOrderStatus.OPEN, vehiculoId: 77 }),
    );

    const workOrderId = createWorkOrderResponse.body.id;

    const updateStatusResponse = await request(httpServer)
      .patch(`/workshop/work-orders/${workOrderId}/status`)
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send({ status: WorkOrderStatus.UNDER_REVIEW });

    expect(updateStatusResponse.status).toBe(200);
    expect(updateStatusResponse.body).toEqual(
      expect.objectContaining({ id: workOrderId, estado: WorkOrderStatus.UNDER_REVIEW }),
    );

    const closeResponse = await request(httpServer)
      .patch(`/workshop/work-orders/${workOrderId}/close`)
      .set('Authorization', `Bearer ${issuedAccessToken}`)
      .send({ checklist: 'Checklist completo', result: 'Aprobado' });

    expect(closeResponse.status).toBe(200);
    expect(closeResponse.body).toEqual(
      expect.objectContaining({ otId: workOrderId, resultado: 'Aprobado', estado: WorkOrderStatus.CLOSED }),
    );

    const overviewResponse = await request(httpServer)
      .get('/workshop/overview?include=workOrders')
      .set('Authorization', `Bearer ${issuedAccessToken}`);

    expect(overviewResponse.status).toBe(200);
    expect(overviewResponse.body.workOrders.total).toBe(workOrdersStore.length);
    expect(lastAuthorizationHeader).toBe(`Bearer ${issuedAccessToken}`);
  });
});
