import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming PrismaModule exports PrismaService

@Module({
  imports: [PrismaModule], // Import PrismaModule to make PrismaService available
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
