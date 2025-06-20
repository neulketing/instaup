"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderToExternal = sendOrderToExternal;
exports.processPendingOrder = processPendingOrder;
const socketService_1 = require("./socketService");
async function sendOrderToExternal(orderDetails) {
    console.log(`[Mock] Sending order to external API: ${JSON.stringify(orderDetails)}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        success: true,
        externalOrderId: `EXT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
}
async function processPendingOrder(orderId) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('../index')));
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new Error(`Order not found: ${orderId}`);
    if (order.status !== 'PENDING')
        return;
    const response = await sendOrderToExternal({ orderId: order.id, serviceId: order.serviceId, targetUrl: order.targetUrl, quantity: order.quantity });
    let updatedOrder;
    if (response.success && response.externalOrderId) {
        updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING', apiOrderId: response.externalOrderId, processedAt: new Date() } });
    }
    else {
        updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED', apiError: response.errorMessage } });
    }
    (0, socketService_1.broadcastOrderUpdate)(global.ioServer, orderId, { status: updatedOrder.status, progress: updatedOrder.progress });
}
