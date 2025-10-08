import { Test, TestingModule } from '@nestjs/testing';
import { AseoService } from './aseo.service';

describe('AseoService', () => {
  let service: AseoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AseoService],
    }).compile();

    service = module.get<AseoService>(AseoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
