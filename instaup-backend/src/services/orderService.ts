import { Order, Service } from '@prisma/client';
import { broadcastOrderUpdate } from './socketService';

interface OrderDetails {
  orderId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  // Add other relevant details from the Prisma Order model
}

interface ExternalApiResponse {
  success: boolean;
  externalOrderId?: string;
  errorMessage?: string;
  // Other fields from a typical provider API response
}

/**
 * Sends an order to an external SNS API provider.
 * Currently, this is a mock implementation.
 *
 * @param orderDetails - The details of the order to be sent.
 * @returns A promise that resolves with the external API response.
 */
export async function sendOrderToExternal(orderDetails: OrderDetails): Promise<ExternalApiResponse> {
  console.log(`[Mock] Sending order to external API: ${JSON.stringify(orderDetails)}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a successful response for most cases
  // To test different scenarios, you can introduce logic here, e.g.,
  // if (orderDetails.serviceId === 'problematic-service') {
  //   return { success: false, errorMessage: 'Provider API error: Service unavailable' };
  // }

  return {
    success: true,
    externalOrderId: `EXT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
}

/**
 * Processes a pending order by sending it to external API and updating DB.
 */
 export async function processPendingOrder(orderId: string): Promise<void> {
   const { prisma } = await import('../index');
   const order = await prisma.order.findUnique({ where: { id: orderId } });
   if (!order) throw new Error(`Order not found: ${orderId}`);
   if (order.status !== 'PENDING') return;
   // send to external API
   const response = await sendOrderToExternal({ orderId: order.id, serviceId: order.serviceId, targetUrl: order.targetUrl, quantity: order.quantity });
   let updatedOrder;
   if (response.success && response.externalOrderId) {
     updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: 'PROCESSING', apiOrderId: response.externalOrderId, processedAt: new Date() } });
   } else {
     updatedOrder = await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED', apiError: response.errorMessage } });
   }
   // Broadcast order update
   broadcastOrderUpdate((global as any).ioServer, orderId, { status: updatedOrder.status, progress: updatedOrder.progress })
 }

// Example usage (for testing purposes, not for actual use in this file)
/*
async function testSendOrder() {
  const sampleOrder: OrderDetails = {
    orderId: 'ORD-12345',
    serviceId: 'SVC-INSTA-LIKES',
    targetUrl: 'https://instagram.com/p/yourpost',
    quantity: 100,
  };
  try {
    const response = await sendOrderToExternal(sampleOrder);
    console.log('External API Response:', response);
  } catch (error) {
    console.error('Error sending order:', error);
  }
}

// testSendOrder();
*/
