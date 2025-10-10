import { Test, TestingModule } from '@nestjs/testing';
import { CivilWorkController } from './civil-work.controller';
import { CivilWorkService } from './civil-work.service';

describe('CivilWorkController', () => {
  let controller: CivilWorkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CivilWorkController],
      providers: [CivilWorkService],
    }).compile();

    controller = module.get<CivilWorkController>(CivilWorkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
