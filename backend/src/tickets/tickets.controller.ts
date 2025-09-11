import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tickets')
/// Nueva seguridad global para el controlador de tickets
/// Cualquier petición a tickets ahora requiere un token de autenticación válido.
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {   //  ParseIntPipe: Valida que el 'id' sea un número y lo convierte automáticamente.
    /// Mejora de validación y manejo de errores
    const ticket = await this.ticketsService.findOne(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);    //  NotFoundException: Devuelve un error 404  si el ticket no existe.
    }
    return ticket;
  }

  @Patch(':id')
  /// Solo los roles especificados podrán ejecutar esta acción.
  @Roles(Role.Admin, Role.IT, Role.Transporte)
  @UseGuards(RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  /// Solo los Administradores pueden borrar tickets.
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
