import { DashboardService } from './dashboard.service';

const createListMock = (result: unknown) => jest.fn().mockResolvedValue(result);

describe('DashboardService', () => {
  const vehicleService = { findAll: createListMock({}) } as any;
  const workOrderService = { findAll: createListMock({}) } as any;
  const ticketService = { findAll: createListMock({}) } as any;
  const cleaningService = { findAll: createListMock({}) } as any;
  const civilWorkService = { findAll: createListMock({}) } as any;
  const incidentService = { findAll: createListMock({}) } as any;
  const notificationService = { findAllForUser: jest.fn().mockResolvedValue({}) } as any;
  const usersService = { findAll: createListMock({}) } as any;

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DashboardService(
      vehicleService,
      workOrderService,
      ticketService,
      cleaningService,
      civilWorkService,
      incidentService,
      notificationService,
      usersService,
    );
  });

  it('requests only selected modules', async () => {
    const result = await service.getOverview(1, { modules: ['tickets', 'notifications'] });

    expect(ticketService.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(notificationService.findAllForUser).toHaveBeenCalledWith(1, { page: 1, pageSize: 20 });
    expect(vehicleService.findAll).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ tickets: {}, notifications: {} }));
  });

  it('uses defaults when no modules provided', async () => {
    await service.getOverview(2, {});
    expect(vehicleService.findAll).toHaveBeenCalled();
    expect(usersService.findAll).toHaveBeenCalled();
  });
});
