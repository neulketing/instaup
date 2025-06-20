import { PrismaClient, OrderStatus } from '@prisma/client';

// Assume prisma client is initialized and exported from a central file
// For example: import prisma from '../prismaClient';
// If not, replace `new PrismaClient()` with your actual prisma instance
const prisma = new PrismaClient();

export const getDashboardMetrics = async () => {
  try {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();

    const revenueData = await prisma.order.aggregate({
      _sum: {
        charge: true,
      },
      where: {
        OR: [
          { status: OrderStatus.COMPLETED },
          { status: OrderStatus.PARTIAL },
        ],
      },
    });
    const totalRevenue = revenueData._sum.charge || 0;

    // Fetch admin logs count as an example of another metric
    const totalAdminLogs = await prisma.adminLog.count();

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalAdminLogs, // Added this as an example
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to retrieve dashboard metrics.');
  }
};

// Potential future service functions for admin panel:
// export const getRecentOrders = async (limit: number = 10) => { ... }
// export const getUserStats = async () => { ... }
// export const getServiceUsage = async () => { ... }
