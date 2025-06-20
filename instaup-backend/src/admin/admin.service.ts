import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService path
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<{ totalUsers: number; totalOrders: number; totalRevenue: number }> {
    const totalUsers = await this.prisma.user.count();
    const totalOrders = await this.prisma.order.count();

    const revenueData = await this.prisma.order.aggregate({
      _sum: {
        charge: true,
      },
      where: {
        status: OrderStatus.COMPLETED, // Calculate revenue only from completed orders
      },
    });
    const totalRevenue = revenueData._sum.charge || 0;

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
    };
  }

  // Placeholder for future admin service methods (Service CRUD, Order Management, User Management)
}
