import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { RepuestoService } from './repuesto.service';
import { CreateRepuestoDto } from './dto/create-repuesto.dto';

@Controller('repuesto')
export class RepuestoController {
  constructor(private readonly repuestoService: RepuestoService) {}

  @Post()
  create(@Body() createRepuestoDto: CreateRepuestoDto) {
    return this.repuestoService.create(createRepuestoDto);
  }

  @Get()
  findAll() {
    return this.repuestoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repuestoService.findOne(+id);
  }

  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body('stock') stock: number) {
    return this.repuestoService.updateStock(+id, stock);
  }

  @Post(':id/alerta-stock-minimo')
  generarAlertaStockMinimo(@Param('id') id: string, @Body() alertaDto: { stockMinimo: number }) {
    return this.repuestoService.generarAlertaStockMinimo(+id, alertaDto.stockMinimo);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repuestoService.remove(+id);
  }
}
