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
  ValidationPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import type { TicketAttachmentsResponse } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApproveStepDto } from './dto/approve-step.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketsService: TicketService) {}

  @Post()
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor, Role.Especialista, Role.Trabajador)
  @UseGuards(RolesGuard)
  create(@Body() createTicketDto: CreateTicketDto, @Req() req) {
    const createdById = req.user.userId;
    return this.ticketsService.create(createTicketDto, createdById);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    paginationQuery: PaginationQueryDto,
  ) {
    return this.ticketsService.findAll(paginationQuery);
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
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor, Role.Especialista)
  @UseGuards(RolesGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTicketDto: UpdateTicketDto, @Req() req) {
    const updatedById = req.user.userId;
    return this.ticketsService.update(id, updateTicketDto, updatedById);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }

  @Patch(':id/approvals/:approvalId')
  @UseGuards(JwtAuthGuard)
  approveStep(
    @Param('id', ParseIntPipe) ticketId: number,
    @Param('approvalId', ParseIntPipe) approvalId: number,
    @Body() approveStepDto: ApproveStepDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.ticketsService.approveStep(ticketId, approvalId, userId, approveStepDto);
  }

  @Post(':id/attachments')
  @Roles(Role.Admin, Role.Jefe, Role.Supervisor, Role.Especialista, Role.Trabajador)
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 7 * 1024 * 1024 },
    }),
  )
  uploadAttachments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<TicketAttachmentsResponse> {
    return this.ticketsService.addAttachments(id, files);
  }
}
