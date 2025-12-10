import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { AuthUser } from '@/common/auth-user.decorator';
import { ItInventoryService } from './it-inventory.service';
import { ListItAssetsDto } from './dto/list-it-assets.dto';
import { CreateItAssetDto } from './dto/create-it-asset.dto';
import { UpdateItAssetDto } from './dto/update-it-asset.dto';
import { ChangeItAssetStatusDto } from './dto/change-it-asset-status.dto';
import { AssignItAssetDto } from './dto/assign-it-asset.dto';
import { UnassignItAssetDto } from './dto/unassign-it-asset.dto';

@Controller('it-inventory/assets')
export class ItInventoryController {
  constructor(private readonly service: ItInventoryService) {}

  @Get()
  listAssets(@Query(new ValidationPipe({ transform: true, whitelist: true })) filters: ListItAssetsDto) {
    return this.service.listAssets(filters);
  }

  @Get(':id')
  getAsset(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAsset(id);
  }

  @Post()
  createAsset(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateItAssetDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.service.createAsset(dto, user);
  }

  @Patch(':id')
  updateAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateItAssetDto,
  ) {
    return this.service.updateAsset(id, dto);
  }

  @Post(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: ChangeItAssetStatusDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.service.changeStatus(id, dto, user);
  }

  @Post(':id/assign')
  assignAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: AssignItAssetDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.service.assignAsset(id, dto, user);
  }

  @Post(':id/unassign')
  unassignAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UnassignItAssetDto,
    @AuthUser() user?: { username?: string; email?: string },
  ) {
    return this.service.unassignAsset(id, dto, user);
  }

  @Get(':id/movements')
  listMovements(@Param('id', ParseIntPipe) id: number) {
    return this.service.listMovements(id);
  }
}
