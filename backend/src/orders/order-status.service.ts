import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { OrderStatus } from 'generated/prisma/client';
import { OrderEntity } from './entities/order.entity';
import { OrderProductionService } from './order-production.service';
import { OrderTableService } from './order-table.service';
import { mapOrderToEntity } from './order.mapper';

const ORDER_INCLUDE = {
  items: true,
  operator: { select: { id: true, username: true, role: true } },
  closedByOperator: { select: { id: true, username: true, role: true } },
};

@Injectable()
export class OrderStatusService {
  private readonly logger = new Logger(OrderStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productionService: OrderProductionService,
    private readonly tableService: OrderTableService,
  ) {}

  async cancel(id: number): Promise<OrderEntity> {
    const start = Date.now();
    this.logger.log(`Cancelando pedido ${id}`);

    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: { include: { productions: true } },
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (order.status === OrderStatus.PAID) {
      this.logger.warn(`Tentativa de cancelar pedido ${id} já pago`);
      throw new BadRequestException('Pedidos pagos não podem ser cancelados');
    }

    await this.prisma.client.$transaction(async (tx) => {
      await this.productionService.cancelAllByOrderItems(
        tx,
        order.items.map((i) => i.id),
      );

      const table = await this.tableService.findByOrderId(tx, id);
      if (table) {
        await this.tableService.release(tx, table.id);
      }

      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELED },
      });
    });

    const canceledOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    this.logger.log(`Pedido ${id} cancelado em ${Date.now() - start}ms`);

    return mapOrderToEntity(canceledOrder!);
  }

  async reopen(id: number): Promise<OrderEntity> {
    const start = Date.now();
    this.logger.log(`Reabrindo pedido ${id}`);

    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (order.status === OrderStatus.OPEN) {
      throw new BadRequestException('Pedido já está aberto');
    }

    if (order.status === OrderStatus.PAID) {
      this.logger.warn(`Tentativa de reabrir pedido ${id} já pago`);
      throw new BadRequestException('Pedido pago não pode ser reaberto');
    }

    let tableRecord: { id: number; status: string } | null = null;

    if (order.table) {
      const tableNumber = this.tableService.parseTableNumber(order.table);

      if (tableNumber !== null) {
        tableRecord = await this.tableService.findTableRecord(
          this.prisma.client,
          order.table,
          order.locationId,
        );

        if (tableRecord?.status === 'OCCUPIED') {
          this.logger.warn(
            `Mesa ${tableNumber} do pedido ${id} já ocupada por outro cliente`,
          );
          throw new BadRequestException(
            `Mesa ${tableNumber} já está ocupada por outro cliente`,
          );
        }
      }
    }

    await this.prisma.client.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.OPEN,
          finishedAt: null,
          closedByOperatorId: null,
        },
      });

      if (tableRecord) {
        await this.tableService.occupy(
          tx,
          tableRecord.id,
          id,
          order.customerName,
        );
      }
    });

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    this.logger.log(`Pedido ${id} reaberto em ${Date.now() - start}ms`);

    return mapOrderToEntity(updated!);
  }
}
