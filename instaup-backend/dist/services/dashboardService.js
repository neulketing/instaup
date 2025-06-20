"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDashboardMetrics = async () => {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();
    const totalRevenueData = await prisma.order.aggregate({
        _sum: {
            charge: true,
        },
        where: {
            status: client_1.OrderStatus.COMPLETED,
        },
    });
    const totalRevenue = totalRevenueData._sum.charge ?? 0;
    const totalServices = await prisma.service.count();
    const pendingOrders = await prisma.order.count({
        where: {
            status: client_1.OrderStatus.PENDING,
        }
    });
    const processingOrders = await prisma.order.count({
        where: {
            status: client_1.OrderStatus.PROCESSING,
        }
    });
    return {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalServices,
        pendingOrders,
        processingOrders,
    };
};
exports.getDashboardMetrics = getDashboardMetrics;
