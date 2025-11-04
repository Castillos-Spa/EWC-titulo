import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get } from '@nestjs/common';
import request from 'supertest';

@Controller()
class PingController {
  @Get()
  getHello() {
    return 'Hello World!';
  }
}

describe('PingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => request(app.getHttpServer()).get('/').expect(200).expect('Hello World!'));
});
