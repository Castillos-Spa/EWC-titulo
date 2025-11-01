import { Controller, Get, Query, Request, UnauthorizedException, UseGuards, ValidationPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  getOverview(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DashboardOverviewQueryDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User identifier missing in request context.');
    }
    return this.dashboardService.getOverview(userId, query);
  }
}
