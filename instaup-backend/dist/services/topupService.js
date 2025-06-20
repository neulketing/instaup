"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topUpBalance = topUpBalance;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const orderService_1 = require("./orderService");
const notifications_1 = require("../utils/notifications");
async function topUpBalance(userId, amount) {
    if (amount <= 0)
        throw new Error('충전 금액은 0보다 커야 합니다.');
    try {
        const topupResult = await database_1.prisma.$transaction(async (tx) => {
            const topup = await tx.topUp.create({
                data: { userId, amount, status: client_1.TopUpStatus.SUCCESS }
            });
            await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            });
            await tx.payment.create({
                data: {
                    orderId: topup.id,
                    userId,
                    amount,
                    method: client_1.PaymentMethod.POINTS,
                    status: client_1.PaymentStatus.COMPLETED
                }
            });
            return topup;
        });
        const retryResult = await (0, orderService_1.retryPendingOrders)(userId);
        await (0, notifications_1.sendAdminNotification)({
            type: 'topup_success',
            userId,
            amount
        });
        return {
            topup: topupResult,
            retriedOrders: retryResult
        };
    }
    catch (error) {
        await (0, notifications_1.sendAdminNotification)({
            type: 'topup_failed',
            userId,
            error: String(error)
        });
        throw error;
    }
}
