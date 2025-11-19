import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { PaginationQueryDto } from '@/app/shared/dto/pagination-query.dto';
import { NotificationService } from '@/features/notification/notification.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notifications: NotificationService,
  ) {}

  async create(createTransportRouteDto: CreateRouteDto) {
    return this.prisma.transportRoute.create({
      data: createTransportRouteDto,
    });
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportRoute.findMany({
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transportRoute.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async findAllAssignments(paginationQuery: PaginationQueryDto) {
    const { page = 1, pageSize = 20 } = paginationQuery;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.truckAssignment.findMany({
        skip,
        take: pageSize,
        include: {
          truck: true,
          route: true,
          driver: true,
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.truckAssignment.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async createAssignment(data: any) {
    const created = await this.prisma.truckAssignment.create({
      data: {
        ...data,
        truckId: Number(data.truckId),
        routeId: Number(data.routeId),
        driverId: Number(data.driverId),
      },
      include: {
        truck: true,
        route: true,
        driver: true,
      },
    });

    // Enviar notificación al conductor asignado por cada ruta
    try {
      const truck = created.truck as any;
      const route = created.route as any;
      const code = (truck?.codigo ?? truck?.patente ?? `VEH-${created.truckId}`).toString().toUpperCase();
      const brandModel = [truck?.marca, truck?.modelo].filter(Boolean).join(' ').trim();
      const routeLabel = route?.code ? `${route.code} — ${route.origin} → ${route.destination}` : `Ruta #${created.routeId}`;
      const day = new Date(created.date).toISOString().slice(0, 10);

      await this.notifications.createNotification({
        title: 'Nueva asignación de ruta',
        message: `Se te asignó la ruta ${routeLabel} para el día ${day} con el camión ${brandModel} [${code}].`,
        type: 'route_assignment',
        createdById: created.driverId, // Fallback: conductor como originador; idealmente, pasar el usuario real
        userId: created.driverId,
      });
    } catch (e) {
      // No bloquear el flujo por errores de notificación
      // eslint-disable-next-line no-console
      console.warn('No se pudo enviar notificación de asignación de ruta', e);
    }

    return created;
  }

  async removeAssignment(id: number) {
    return this.prisma.truckAssignment.delete({ where: { id } });
  }

  async findOne(id: number) {
    const route = await this.prisma.transportRoute.findUnique({
      where: { id },
    });
    if (!route) {
      throw new NotFoundException(`Route with ID #${id} not found.`);
    }
    return route;
  }

  async update(id: number, updateTransportRouteDto: UpdateRouteDto) {
    await this.findOne(id);
    return this.prisma.transportRoute.update({
      where: { id },
      data: updateTransportRouteDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.transportRoute.delete({
      where: { id },
    });
  }
}
