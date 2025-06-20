"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardMetrics = async () => {
    try {
        const totalUsers = await prisma.user.count();
        const totalOrders = await prisma.order.count();
        const revenueData = await prisma.order.aggregate({
            _sum: {
                charge: true,
            },
            where: {
                OR: [
                    { status: client_1.OrderStatus.COMPLETED },
                    { status: client_1.OrderStatus.PARTIAL },
                ],
            },
        });
        const totalRevenue = revenueData._sum.charge || 0;
        const totalAdminLogs = await prisma.adminLog.count();
        return {
            totalUsers,
            totalOrders,
            totalRevenue,
            totalAdminLogs,
        };
    }
    catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw new Error('Failed to retrieve dashboard metrics.');
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
