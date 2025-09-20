import { Test, TestingModule } from '@nestjs/testing';
import { NotificacionGateway } from './notificacion.gateway';
import { NotificacionService } from './notificacion.service';

describe('NotificacionGateway', () => {
  let gateway: NotificacionGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificacionGateway, NotificacionService],
    }).compile();

    gateway = module.get<NotificacionGateway>(NotificacionGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
