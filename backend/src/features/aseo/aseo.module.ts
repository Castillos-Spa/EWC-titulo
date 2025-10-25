import { Module } from '@nestjs/common';
import { AseoService } from './aseo.service';
import { AseoController } from './aseo.controller';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [AseoController],
  providers: [AseoService],
})
export class AseoModule {}
