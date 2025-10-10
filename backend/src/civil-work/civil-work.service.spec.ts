import { Test, TestingModule } from '@nestjs/testing';
import { CivilWorkService } from './civil-work.service';

describe('CivilWorkService', () => {
  let service: CivilWorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CivilWorkService],
    }).compile();

    service = module.get<CivilWorkService>(CivilWorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
