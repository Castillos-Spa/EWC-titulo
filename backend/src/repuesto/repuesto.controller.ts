import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repuestoService.findOne(id);
  }

  @Patch(':id/stock')
  updateStock(@Param('id', ParseIntPipe) id: number, @Body('stock') stock: number) {
    return this.repuestoService.updateStock(id, stock);
  }

  @Post(':id/alerta-stock-minimo')
  generarAlertaStockMinimo(@Param('id', ParseIntPipe) id: number, @Body() alertaDto: { stockMinimo: number }) {
    return this.repuestoService.generarAlertaStockMinimo(id, alertaDto.stockMinimo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.repuestoService.remove(id);
  }
}
