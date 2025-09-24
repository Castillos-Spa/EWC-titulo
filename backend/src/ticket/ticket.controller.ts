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
  Req,
  NotFoundException,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketsService: TicketService) {}

  @Post()
  @Roles(Role.Admin, Role.IT, Role.Transporte, Role.Obras, Role.Aseo)
  @UseGuards(RolesGuard)
  create(@Body() createTicketDto: CreateTicketDto, @Req() req) {
    const createdById = req.user.userId;
    return this.ticketsService.create(createTicketDto, createdById);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const ticket = await this.ticketsService.findOne(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID #${id} no encontrado`);
    }
    return ticket;
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.IT, Role.Transporte)
  @UseGuards(RolesGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTicketDto: UpdateTicketDto, @Req() req) {
    const updatedById = req.user.id;
    return this.ticketsService.update(id, updateTicketDto, updatedById);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
