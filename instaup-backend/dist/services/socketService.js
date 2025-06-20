"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.broadcastOrderUpdate = broadcastOrderUpdate;
exports.broadcastUserNotification = broadcastUserNotification;
exports.broadcastAdminAlert = broadcastAdminAlert;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const index_1 = require("../index");
function initializeSocket(io) {
    global.ioServer = io;
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await index_1.prisma.user.findUnique({
                where: { id: decoded.id }
            });
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            socket.user = {
                id: user.id,
                email: user.email
            };
            logger_1.logger.info(`User ${user.email} connected via WebSocket`);
            next();
        }
        catch (error) {
            logger_1.logger.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (userId) {
            socket.join(`user:${userId}`);
            socket.join('admins');
        }
        socket.on('track_order', async (orderId) => {
            try {
                if (!userId)
                    return;
                const order = await index_1.prisma.order.findFirst({
                    where: {
                        id: orderId,
                        userId: userId
                    },
                    include: {
                        service: true,
                        payment: true
                    }
                });
                if (order) {
                    socket.emit('order_status', {
                        orderId: order.id,
                        status: order.status,
                        progress: order.progress,
                        service: order.service.name,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Error tracking order:', error);
                socket.emit('error', { message: 'Failed to track order' });
            }
        });
        socket.on('admin_dashboard', async () => {
            try {
                if (!userId)
                    return;
                const admin = await index_1.prisma.admin.findUnique({
                    where: { email: socket.user?.email }
                });
                if (!admin) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }
                const stats = await getAdminStats();
                socket.emit('admin_stats', stats);
            }
            catch (error) {
                logger_1.logger.error('Error getting admin dashboard:', error);
                socket.emit('error', { message: 'Failed to get admin data' });
            }
        });
        socket.on('user_activity', async (activity) => {
            try {
                if (!userId)
                    return;
                await index_1.prisma.userActivity.create({
                    data: {
                        userId: userId,
                        action: activity.action,
                        data: activity.data,
                        ipAddress: socket.handshake.address,
                        userAgent: socket.handshake.headers['user-agent']
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('Error tracking user activity:', error);
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`User ${socket.user?.email} disconnected from WebSocket`);
        });
    });
    return io;
}
function broadcastOrderUpdate(io, orderId, update) {
    io.to(`order:${orderId}`).emit('order_update', update);
    io.to('admins').emit('admin_order_update', { orderId, ...update });
}
function broadcastUserNotification(io, userId, notification) {
    io.to(`user:${userId}`).emit('notification', notification);
}
function broadcastAdminAlert(io, alert) {
    io.to('admins').emit('admin_alert', alert);
}
async function getAdminStats() {
    const [totalUsers, totalOrders, totalRevenue, todayOrders, activeOrders, recentOrders] = await Promise.all([
        index_1.prisma.user.count(),
        index_1.prisma.order.count(),
        index_1.prisma.payment.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true }
        }),
        index_1.prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        }),
        index_1.prisma.order.count({
            where: {
                status: {
                    in: ['PROCESSING', 'IN_PROGRESS']
                }
            }
        }),
        index_1.prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { email: true, nickname: true }
                },
                service: {
                    select: { name: true, platform: true }
                }
            }
        })
    ]);
    return {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        todayOrders,
        activeOrders,
        recentOrders
    };
}
