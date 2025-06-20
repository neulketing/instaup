import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
// import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'; // TODO: Implement and apply an AdminAuthGuard

@Controller('admin') // Route prefix, e.g., /api/admin if global prefix is /api
// @UseGuards(AdminAuthGuard) // TODO: Secure admin routes
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/metrics')
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    return this.adminService.getDashboardMetrics();
  }

  // Placeholder for future admin controller methods
}
