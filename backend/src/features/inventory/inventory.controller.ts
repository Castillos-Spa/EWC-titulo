import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, ValidationPipe } from '@nestjs/common';
import { AuthUser } from '@/common/auth-user.decorator';
import { InventoryService } from './inventory.service';
import { ListInventoryItemsDto } from './dto/list-inventory-items.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  listItems(@Query(new ValidationPipe({ whitelist: true, transform: true })) filters: ListInventoryItemsDto) {
    return this.inventoryService.listItems(filters);
  }

  @Get('items/:id')
  getItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getItem(id);
  }

  @Post('items')
  createItem(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateInventoryItemDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.inventoryService.createItem(dto, user);
  }

  @Put('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Post('items/:id/adjust-stock')
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: AdjustStockDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.inventoryService.adjustStock(id, dto, user);
  }

  @Get('items/:id/movements')
  listMovements(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.listMovements(id);
  }

  @Post('items/:id/deactivate')
  deactivateItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deactivateItem(id);
  }
}
