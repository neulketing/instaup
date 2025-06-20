import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, OrderStatus } from '@prisma/client'; // Assuming Order type from Prisma
import { sendOrderToExternal } from '../services/orderService';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private prisma: PrismaService) {}

  // ... other order methods like createOrder, getOrderById, etc. might exist here

  /**
   * Sends an order to an external SNS API provider.
   * This is a mock implementation for now.
   * @param order - The order object to be processed.
   */
  async sendOrderToExternalApi(order: Order): Promise<{ success: boolean; apiOrderId?: string; error?: string }> {
    this.logger.log(`Attempting to send Order ID: ${order.id} (${order.shortId || 'N/A'}) to external API.`);
    this.logger.log(`Service ID: ${order.serviceId}, Target: ${order.targetUrl}, Quantity: ${order.quantity}`);

    // TODO: Replace with actual external API integration logic
    // This mock will simulate a successful API call after a short delay
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const mockApiOrderId = `MOCK_API_${Date.now()}`;
    this.logger.log(`Mock API call successful for Order ID: ${order.id}. API Order ID: ${mockApiOrderId}`);

    return { success: true, apiOrderId: mockApiOrderId };

    // Example of simulating a failure:
    // this.logger.warn(`Mock API call failed for Order ID: ${order.id}.`);
    // return { success: false, error: "Mock API provider is offline" };
  }

  /**
   * Example of a method that processes a pending order by sending it to an external API.
   * This could be triggered after order creation & payment confirmation, or by a scheduler.
   * @param orderId - The ID of the order to process.
   */
  async processPendingOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      this.logger.error(`Order with ID ${orderId} not found for processing.`);
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status === OrderStatus.PENDING) {
      this.logger.log(`Processing order ${order.id}...`);

      try {
        const externalApiResponse = await sendOrderToExternal(order);

        const logs = Array.isArray(order.logs) ? order.logs : [];

        if (externalApiResponse.success) {
          logs.push({ status: OrderStatus.PROCESSING, timestamp: new Date().toISOString(), actor: "system", message: "Sent to API provider.", apiOrderId: externalApiResponse.apiOrderId });
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.PROCESSING,
              apiOrderId: externalApiResponse.apiOrderId,
              processedAt: new Date(),
              logs: logs,
            },
          });
          this.logger.log(`Order ${order.id} status updated to PROCESSING. API Order ID: ${externalApiResponse.apiOrderId}`);
        } else {
          logs.push({ status: OrderStatus.FAILED, timestamp: new Date().toISOString(), actor: "system", message: `API error: ${externalApiResponse.error}` });
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.FAILED,
              apiError: externalApiResponse.error,
              logs: logs,
            },
          });
          this.logger.error(`Failed to process order ${order.id} with external API: ${externalApiResponse.error}`);
        }
      } catch (error) {
        this.logger.error(`Error during processing order ${order.id}: ${error.message}`, error.stack);
        const logs = Array.isArray(order.logs) ? order.logs : [];
        logs.push({ status: OrderStatus.FAILED, timestamp: new Date().toISOString(), actor: "system", message: `Internal error processing order: ${error.message}` });
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.FAILED,
            apiError: `Internal error: ${error.message}`,
            logs: logs,
          },
        });
      }
    } else {
      this.logger.warn(`Order ${order.id} is not in PENDING state (current: ${order.status}). Skipping external API call.`);
    }
  }
}
