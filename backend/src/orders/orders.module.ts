import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './order.service';
import { OrderStatusService } from './order-status.service';
import { OrderItemsService } from './order-items.service';
import { OrderProductionService } from './order-production.service';
import { OrderStockService } from './order-stock.service';
import { OrderTableService } from './order-table.service';
import { OrderPrintService } from './order-print.service';
import { OrdersController } from './orders.controller';
import { PrinterModule } from '../printer/printer.module';
import { OrderCleanupService } from './order-cleanup.service';

@Module({
  imports: [
    PrinterModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderStatusService,
    OrderItemsService,
    OrderProductionService,
    OrderStockService,
    OrderTableService,
    OrderPrintService,
    OrderCleanupService,
  ],
  exports: [OrdersService, OrderStatusService],
})
export class OrdersModule {}
