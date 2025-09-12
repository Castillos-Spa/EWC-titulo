import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SolicitudCompraService } from './solicitud-compra.service';
import { CreateSolicitudCompraDto } from './dto/create-solicitud-compra.dto';

@Controller('solicitud-compra')
export class SolicitudCompraController {
  constructor(private readonly solicitudCompraService: SolicitudCompraService) {}

  @Post()
  create(@Body() createSolicitudCompraDto: CreateSolicitudCompraDto) {
    return this.solicitudCompraService.createSolicitudCompra(createSolicitudCompraDto);
  }

  @Get()
  findAll() {
    return this.solicitudCompraService.findAllSolicitudCompra();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicitudCompraService.findOneSolicitudCompra(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.solicitudCompraService.removeSolicitudCompra(+id);
  }

  @Post(':id/aprobar')
  async aprobarSolicitud(@Param('id') id: string) {
    return this.solicitudCompraService.aprobarSolicitud(+id);
  }
}
