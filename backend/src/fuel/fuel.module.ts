import { Module } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { PrismaService } from 'prisma/prisma.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FuelController],
  providers: [FuelService, PrismaService],
  exports: [FuelService],
})
export class FuelModule {}
