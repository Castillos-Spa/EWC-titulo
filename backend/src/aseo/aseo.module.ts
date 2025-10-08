import { Module } from '@nestjs/common';
import { AseoService } from './aseo.service';
import { AseoController } from './aseo.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AseoController],
  providers: [AseoService, PrismaService],
})
export class AseoModule {}
