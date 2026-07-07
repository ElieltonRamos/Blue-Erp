// src/orders/order-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SingleInstance } from '../common/decorators/single-instance.decorator';
import { PrismaService } from 'src/database/prisma.service';
import { resolveLogicalDateTime } from '../common/date-utils';
import { AutoClosedOrderDto } from './dto/auto-closed-order.dto';

const SYSTEM_OPERATOR_ID = 1;

@Injectable()
export class OrderCleanupService {
  private readonly logger = new Logger(OrderCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('45 5 * * *', { name: 'order-cleanup' })
  @SingleInstance()
  async cleanupStaleOrders() {
    const staleOrders = await this.prisma.client.order.findMany({
      where: {
        status: 'OPEN',
      },
      select: { id: true },
    });

    if (staleOrders.length === 0) {
      this.logger.log('Nenhuma comanda fantasma encontrada.');
      return;
    }

    const orderIds = staleOrders.map((o) => o.id);

    await this.prisma.client.$transaction([
      this.prisma.client.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          status: 'CLOSED',
          closedByOperatorId: SYSTEM_OPERATOR_ID,
          serviceCharge: 0,
          finishedAt: resolveLogicalDateTime(),
        },
      }),
      this.prisma.client.table.updateMany({
        where: { orderId: { in: orderIds } },
        data: {
          orderId: null,
          status: 'AVAILABLE',
        },
      }),
    ]);

    this.logger.warn(
      `Cleanup: ${orderIds.length} comanda(s) fechada(s) automaticamente. IDs: ${orderIds.join(', ')}`,
    );
  }

  async findAutoClosed(): Promise<AutoClosedOrderDto[]> {
    const orders = await this.prisma.client.order.findMany({
      where: {
        closedByOperatorId: SYSTEM_OPERATOR_ID,
        status: 'CLOSED',
      },
      select: {
        id: true,
        locationId: true,
        table: true,
        customerName: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      total: Number(o.total),
    }));
  }

  async findClosedWithoutPayment(): Promise<AutoClosedOrderDto[]> {
    const orders = await this.prisma.client.order.findMany({
      where: {
        status: 'CLOSED',
        closedByOperatorId: { not: SYSTEM_OPERATOR_ID },
      },
      select: {
        id: true,
        locationId: true,
        table: true,
        customerName: true,
        total: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      total: Number(o.total),
    }));
  }
}
