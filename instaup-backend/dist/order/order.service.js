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
var OrderService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const orderService_1 = require("../services/orderService");
let OrderService = OrderService_1 = class OrderService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrderService_1.name);
    }
    async sendOrderToExternalApi(order) {
        this.logger.log(`Attempting to send Order ID: ${order.id} (${order.shortId || 'N/A'}) to external API.`);
        this.logger.log(`Service ID: ${order.serviceId}, Target: ${order.targetUrl}, Quantity: ${order.quantity}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockApiOrderId = `MOCK_API_${Date.now()}`;
        this.logger.log(`Mock API call successful for Order ID: ${order.id}. API Order ID: ${mockApiOrderId}`);
        return { success: true, apiOrderId: mockApiOrderId };
    }
    async processPendingOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            this.logger.error(`Order with ID ${orderId} not found for processing.`);
            throw new Error(`Order not found: ${orderId}`);
        }
        if (order.status === client_1.OrderStatus.PENDING) {
            this.logger.log(`Processing order ${order.id}...`);
            try {
                const externalApiResponse = await (0, orderService_1.sendOrderToExternal)(order);
                const logs = Array.isArray(order.logs) ? order.logs : [];
                if (externalApiResponse.success) {
                    logs.push({ status: client_1.OrderStatus.PROCESSING, timestamp: new Date().toISOString(), actor: "system", message: "Sent to API provider.", apiOrderId: externalApiResponse.apiOrderId });
                    await this.prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: client_1.OrderStatus.PROCESSING,
                            apiOrderId: externalApiResponse.apiOrderId,
                            processedAt: new Date(),
                            logs: logs,
                        },
                    });
                    this.logger.log(`Order ${order.id} status updated to PROCESSING. API Order ID: ${externalApiResponse.apiOrderId}`);
                }
                else {
                    logs.push({ status: client_1.OrderStatus.FAILED, timestamp: new Date().toISOString(), actor: "system", message: `API error: ${externalApiResponse.error}` });
                    await this.prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: client_1.OrderStatus.FAILED,
                            apiError: externalApiResponse.error,
                            logs: logs,
                        },
                    });
                    this.logger.error(`Failed to process order ${order.id} with external API: ${externalApiResponse.error}`);
                }
            }
            catch (error) {
                this.logger.error(`Error during processing order ${order.id}: ${error.message}`, error.stack);
                const logs = Array.isArray(order.logs) ? order.logs : [];
                logs.push({ status: client_1.OrderStatus.FAILED, timestamp: new Date().toISOString(), actor: "system", message: `Internal error processing order: ${error.message}` });
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: client_1.OrderStatus.FAILED,
                        apiError: `Internal error: ${error.message}`,
                        logs: logs,
                    },
                });
            }
        }
        else {
            this.logger.warn(`Order ${order.id} is not in PENDING state (current: ${order.status}). Skipping external API call.`);
        }
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], OrderService);
