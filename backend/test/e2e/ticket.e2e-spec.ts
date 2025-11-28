import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TicketController } from '@/features/ticket/ticket.controller';
import { TicketService } from '@/features/ticket/ticket.service';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';

describe('TicketController (e2e)', () => {
  let app: INestApplication;
  const store: any[] = [];

  const ticketService = {
    create: jest.fn(async (dto: any, userId: number) => {
      const ticket = { id: store.length + 1, ...dto, createdById: userId };
      store.push(ticket);
      return ticket;
    }),
    findAll: jest.fn(async (_query: PaginationQueryDto) => ({
      items: store,
      total: store.length,
      page: 1,
      pageSize: store.length,
      totalPages: 1,
    })),
    findOne: jest.fn(async (id: number) => store.find(t => t.id === id) || null),
    update: jest.fn(async (id: number, dto: any) => {
      const index = store.findIndex(t => t.id === id);
      if (index >= 0) {
        store[index] = { ...store[index], ...dto };
        return store[index];
      }
      return null;
    }),
    remove: jest.fn(async (id: number) => {
      const index = store.findIndex(t => t.id === id);
      if (index >= 0) {
        return store.splice(index, 1)[0];
      }
      return null;
    }),
    approveStep: jest.fn(async (_ticketId: number, approvalId: number, userId: number, dto: any) => ({
      ticketId: _ticketId,
      approvalId,
      userId,
      ...dto,
    })),
  } as unknown as TicketService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [{ provide: TicketService, useValue: ticketService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 42 };
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

  it('creates and lists tickets', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/tickets')
      .send({ title: 'Incident', description: 'details' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual(expect.objectContaining({ id: 1, createdById: 42, title: 'Incident' }));

    const listResponse = await request(app.getHttpServer()).get('/tickets');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBe(1);
  });

  it('updates and approves ticket', async () => {
    const updateResponse = await request(app.getHttpServer()).patch('/tickets/1').send({ status: 'Resuelto' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual(expect.objectContaining({ status: 'Resuelto' }));

    const approveResponse = await request(app.getHttpServer()).patch('/tickets/1/approvals/5').send({ approved: true });

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body).toEqual(
      expect.objectContaining({ ticketId: 1, approvalId: 5, userId: 42, approved: true }),
    );
  });

  it('removes ticket', async () => {
    const response = await request(app.getHttpServer()).delete('/tickets/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('follows up and resolves a ticket lifecycle', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/tickets')
      .send({ title: 'Seguimiento', description: 'Revisión de incidente' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toEqual(expect.objectContaining({ id: 1, title: 'Seguimiento' }));

    const inProgressResponse = await request(app.getHttpServer()).patch('/tickets/1').send({ status: 'EnProgreso' });

    expect(inProgressResponse.status).toBe(200);
    expect(inProgressResponse.body).toEqual(expect.objectContaining({ status: 'EnProgreso' }));

    const resolvedResponse = await request(app.getHttpServer()).patch('/tickets/1').send({ status: 'Resuelto' });

    expect(resolvedResponse.status).toBe(200);
    expect(resolvedResponse.body).toEqual(expect.objectContaining({ status: 'Resuelto' }));

    const closedResponse = await request(app.getHttpServer()).patch('/tickets/1').send({ status: 'Cerrado' });

    expect(closedResponse.status).toBe(200);
    expect(closedResponse.body).toEqual(expect.objectContaining({ status: 'Cerrado' }));
  });
});
