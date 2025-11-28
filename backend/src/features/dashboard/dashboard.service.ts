import { Injectable } from '@nestjs/common';
import { VehicleService } from '../vehicle/vehicle.service';
import { WorkOrderService } from '../work-order/work-order.service';
import { TicketService } from '../ticket/ticket.service';
import { CleaningService } from '../cleaning/cleaning.service';
import { CivilWorkService } from '../civil-work/civil-work.service';
import { IncidentService } from '../incident/incident.service';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';
import { Specialty } from '@prisma/client';
import { DashboardOverviewQueryDto, DashboardModuleKey } from './dto/dashboard-overview-query.dto';

const DEFAULT_DASHBOARD_MODULES: DashboardModuleKey[] = [
  'transport',
  'maintenance',
  'tickets',
  'cleaning',
  'civilWorks',
  'incidents',
  'notifications',
  'users',
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly workOrderService: WorkOrderService,
    private readonly ticketService: TicketService,
    private readonly cleaningService: CleaningService,
    private readonly civilWorkService: CivilWorkService,
    private readonly incidentService: IncidentService,
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
  ) {}

  async getOverview(userId: number, query: DashboardOverviewQueryDto) {
    const include = new Set(query.modules && query.modules.length > 0 ? query.modules : DEFAULT_DASHBOARD_MODULES);
    const result: Record<string, unknown> = {};
    const tasks: Promise<void>[] = [];

    if (include.has('transport')) {
      const vehiclesPage = query.vehiclesPage ?? 1;
      const vehiclesPageSize = query.vehiclesPageSize ?? 20;
      const driversPageSize = query.driversPageSize ?? 100;

      tasks.push(
        Promise.all([
          this.vehicleService.findAll({ page: vehiclesPage, pageSize: vehiclesPageSize }),
          this.usersService.findAll({ page: 1, pageSize: driversPageSize, specialty: Specialty.DRIVER }),
        ]).then(([vehicles, drivers]) => {
          result.transport = { vehicles, drivers };
        }),
      );
    }

    if (include.has('maintenance')) {
      const workOrdersPage = query.workOrdersPage ?? 1;
      const workOrdersPageSize = query.workOrdersPageSize ?? 20;
      tasks.push(
        this.workOrderService.findAll({ page: workOrdersPage, pageSize: workOrdersPageSize }).then(workOrders => {
          result.maintenance = { workOrders };
        }),
      );
    }

    if (include.has('tickets')) {
      const ticketsPage = query.ticketsPage ?? 1;
      const ticketsPageSize = query.ticketsPageSize ?? 20;
      tasks.push(
        this.ticketService.findAll({ page: ticketsPage, pageSize: ticketsPageSize }).then(tickets => {
          result.tickets = tickets;
        }),
      );
    }

    if (include.has('cleaning')) {
      const cleaningPage = query.cleaningPage ?? 1;
      const cleaningPageSize = query.cleaningPageSize ?? 20;
      tasks.push(
        this.cleaningService.findAll({ page: cleaningPage, pageSize: cleaningPageSize }).then(cleaning => {
          result.cleaning = cleaning;
        }),
      );
    }

    if (include.has('civilWorks')) {
      const civilWorksPage = query.civilWorksPage ?? 1;
      const civilWorksPageSize = query.civilWorksPageSize ?? 50;
      tasks.push(
        this.civilWorkService.findAll({ page: civilWorksPage, pageSize: civilWorksPageSize }).then(civilWorks => {
          result.civilWorks = civilWorks;
        }),
      );
    }

    if (include.has('incidents')) {
      const incidentsPage = query.incidentsPage ?? 1;
      const incidentsPageSize = query.incidentsPageSize ?? 20;
      tasks.push(
        this.incidentService.findAll({ page: incidentsPage, pageSize: incidentsPageSize }).then(incidents => {
          result.incidents = incidents;
        }),
      );
    }

    if (include.has('notifications')) {
      const notificationsPage = query.notificationsPage ?? 1;
      const notificationsPageSize = query.notificationsPageSize ?? 20;
      tasks.push(
        this.notificationService
          .findAllForUser(userId, { page: notificationsPage, pageSize: notificationsPageSize })
          .then(notifications => {
            result.notifications = notifications;
          }),
      );
    }

    if (include.has('users')) {
      const usersPage = query.usersPage ?? 1;
      const usersPageSize = query.usersPageSize ?? 50;
      tasks.push(
        this.usersService.findAll({ page: usersPage, pageSize: usersPageSize }).then(users => {
          result.users = users;
        }),
      );
    }

    await Promise.all(tasks);

    return result;
  }
}
