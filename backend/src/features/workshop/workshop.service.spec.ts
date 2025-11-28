import { WorkshopService } from './workshop.service';
import { WorkOrderStatus } from '../work-order/work-order.service';

describe('WorkshopService', () => {
  const workOrderService = {
    create: jest.fn(),
    cerrarOT: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ workOrders: [] }),
    updateStatus: jest.fn(),
  } as any;
  const vehicleService = {
    create: jest.fn(),
    update: jest.fn(),
    findByPlate: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ vehicles: [] }),
  } as any;
  const qaService = { create: jest.fn() } as any;
  const usersService = {
    findAll: jest.fn().mockResolvedValue({ users: [] }),
  } as any;

  let service: WorkshopService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkshopService(workOrderService, vehicleService, qaService, usersService);
  });

  it('delegates work order creation and closing', async () => {
    await service.createWorkOrder({} as any);
    await service.closeWorkOrder(1, 'list', 'ok');

    expect(workOrderService.create).toHaveBeenCalled();
    expect(workOrderService.cerrarOT).toHaveBeenCalledWith(1, 'list', 'ok');
  });

  it('updates work order status through dependency', async () => {
    await service.updateWorkOrderStatus(2, WorkOrderStatus.UNDER_REVIEW);
    expect(workOrderService.updateStatus).toHaveBeenCalledWith(2, WorkOrderStatus.UNDER_REVIEW);
  });

  it('builds overview only with requested modules', async () => {
    const overview = await service.getOverview({ include: ['vehicles'] });
    expect(vehicleService.findAll).toHaveBeenCalled();
    expect(workOrderService.findAll).not.toHaveBeenCalled();
    expect(overview).toEqual({ vehicles: { vehicles: [] } });
  });
});
