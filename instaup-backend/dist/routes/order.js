"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const orderService_1 = require("../services/orderService");
const referral_1 = require("./referral");
const index_1 = require("../index");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.post('/', async (req, res) => {
    try {
        const { serviceId, quantity, targetUrl } = req.body;
        const userId = req.user.id;
        const result = await (0, orderService_1.createOrder)({ userId, serviceId, quantity, targetUrl });
        if (result.order?.id) {
            setTimeout(() => {
                (0, referral_1.processOrderCommissions)(result.order.id);
                (0, referral_1.processPendingOrder)(result.order.id);
            }, 1000);
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('Order create error:', error);
        res.status(400).json({ success: false, error: String(error) });
    }
});
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const orders = await index_1.prisma.order.findMany({
            where: { userId },
            include: {
                service: {
                    select: {
                        name: true,
                        platform: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
        const total = await index_1.prisma.order.count({
            where: { userId }
        });
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: '주문 내역 조회 중 오류가 발생했습니다.'
        });
    }
});
router.patch('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const user = await index_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                error: '관리자 권한이 필요합니다.'
            });
        }
        const order = await index_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : undefined
            }
        });
        if (status === 'COMPLETED') {
            setTimeout(() => {
                (0, referral_1.processOrderCommissions)(orderId);
                (0, referral_1.processPendingOrder)(orderId);
            }, 1000);
        }
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            error: '주문 상태 업데이트 중 오류가 발생했습니다.'
        });
    }
});
exports.default = router;
