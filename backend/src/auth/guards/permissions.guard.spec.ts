/*
https://docs.nestjs.com/fundamentals/testing#unit-testing
*/

import { Test } from '@nestjs/testing';

describe('PermissionsGuard', () => {
    let permissionsGuard: PermissionsGuard;

beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [], // Add
        controllers: [], // Add
        providers: [],   // Add
    }).compile();

    permissionsGuard = moduleRef.get<PermissionsGuard>(PermissionsGuard);
    });

it('should be defined', () => {
    expect(permissionsGuard).toBeDefined();
    });
});
