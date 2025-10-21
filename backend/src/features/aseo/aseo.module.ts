import { Module } from '@nestjs/common';
import { AseoService } from './aseo.service';
import { AseoController } from './aseo.controller';

@Module({
  controllers: [AseoController],
  providers: [AseoService],
})
export class AseoModule {}
