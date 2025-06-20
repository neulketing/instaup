import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
// import { OrderController } from './order.controller'; // If you have order-related HTTP endpoints in this module
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService], // Export OrderService if it needs to be used by other modules
})
export class OrderModule {}
