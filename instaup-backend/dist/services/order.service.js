"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
let OrderService = class OrderService {
    constructor() { }
    async sendOrderToExternal(order, serviceDetails) {
        console.log(`[OrderService] Mock sending order ${order.id} to external API.`);
        console.log(`[OrderService] Target URL: ${order.targetUrl}, Quantity: ${order.quantity}`);
        console.log(`[OrderService] Service Details:`, serviceDetails);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockApiResponse = {
            success: true,
            externalOrderId: `EXT-${Date.now()}`,
            message: 'Order successfully submitted to external provider (mock).',
            remainingBalance: Math.random() * 1000,
        };
        console.log(`[OrderService] Mock API Response for order ${order.id}:`, mockApiResponse);
        return mockApiResponse;
    }
    async updateOrderStatus(orderId, newStatus, apiResponse) {
        console.log(`[OrderService] Updating status for order ${orderId} to ${newStatus}.`);
        if (apiResponse) {
            console.log(`[OrderService] API Response:`, apiResponse);
        }
        return {
            id: orderId,
            shortId: `ORD-${orderId.substring(0, 6)}`,
            userId: 'mockUserId',
            serviceId: 'mockServiceId',
            targetUrl: 'http://example.com/post/123',
            quantity: 100,
            pricePerUnit: 0.1,
            baseAmount: 10,
            discountAmount: 0,
            charge: 10,
            status: newStatus,
            progress: newStatus === 'PROCESSING' ? 50 : (newStatus === 'COMPLETED' ? 100 : 0),
            startCount: 0,
            currentCount: 0,
            remains: 0,
            logs: [{ status: newStatus, timestamp: new Date().toISOString(), actor: "system" }],
            apiOrderId: `EXT-${Date.now()}`,
            apiError: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            processedAt: newStatus !== 'PENDING' ? new Date() : null,
            completedAt: newStatus === 'COMPLETED' ? new Date() : null,
            notes: 'Status updated by OrderService (mock).',
            refillDetails: null,
        };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OrderService);
