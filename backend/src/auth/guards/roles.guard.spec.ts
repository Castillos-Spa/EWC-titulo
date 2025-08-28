/*
https://docs.nestjs.com/fundamentals/testing#unit-testing
*/

import { Test } from '@nestjs/testing';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [], // Add
      controllers: [], // Add
      providers: [], // Add
    }).compile();

    rolesGuard = moduleRef.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });
});
