import { Module } from '@nestjs/common';
import { ItInventoryService } from './it-inventory.service';
import { ItInventoryController } from './it-inventory.controller';

@Module({
  controllers: [ItInventoryController],
  providers: [ItInventoryService],
})
export class ItInventoryModule {}
