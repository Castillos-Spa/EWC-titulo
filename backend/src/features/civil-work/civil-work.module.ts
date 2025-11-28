import { Module } from '@nestjs/common';
import { CivilWorkService } from './civil-work.service';
import { CivilWorkController } from './civil-work.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CivilWorkController],
  providers: [CivilWorkService],
  exports: [CivilWorkService],
})
export class CivilWorkModule {}
