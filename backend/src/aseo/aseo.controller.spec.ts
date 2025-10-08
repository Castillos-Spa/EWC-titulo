import { Test, TestingModule } from '@nestjs/testing';
import { AseoController } from './aseo.controller';
import { AseoService } from './aseo.service';

describe('AseoController', () => {
  let controller: AseoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AseoController],
      providers: [AseoService],
    }).compile();

    controller = module.get<AseoController>(AseoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
