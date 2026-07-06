import { Injectable } from '@nestjs/common';
import { Prisma, ProductType, ProductionStatus } from 'generated/prisma/client';

type TxClient = Prisma.TransactionClient;
type Numeric = number | Prisma.Decimal;

interface CreateProductionParams {
  orderItemId: number;
  productionLocation: string | null | undefined;
  quantityRequested: Numeric;
  observation?: string | null;
  pendingAt: Date;
}

interface ProductionForReduction {
  id: number;
  status: ProductionStatus;
  quantityRequested: Numeric;
}

@Injectable()
export class OrderProductionService {
  isProduced(type: ProductType): boolean {
    return (
      type === ProductType.MANUFACTURED ||
      type === ProductType.SEMI_MANUFACTURED
    );
  }

  async create(tx: TxClient, params: CreateProductionParams): Promise<void> {
    await tx.orderProduction.create({
      data: {
        orderItemId: params.orderItemId,
        productionLocation: params.productionLocation || 'LOCAL_01',
        status: 'PENDING',
        quantityRequested: Number(params.quantityRequested),
        quantityProduced: 0,
        pendingAt: params.pendingAt,
        observation: params.observation ?? null,
      },
    });
  }

  async cancelActiveByOrderItem(
    tx: TxClient,
    orderItemId: number,
  ): Promise<void> {
    await tx.orderProduction.updateMany({
      where: {
        orderItemId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      data: { status: 'CANCELED' },
    });
  }

  async cancelAllByOrderItems(
    tx: TxClient,
    orderItemIds: number[],
  ): Promise<void> {
    await tx.orderProduction.updateMany({
      where: { orderItemId: { in: orderItemIds } },
      data: { status: 'CANCELED' },
    });
  }

  async reduceQuantity(
    tx: TxClient,
    productions: ProductionForReduction[],
    quantityToCancel: number,
  ): Promise<void> {
    let restante = quantityToCancel;
    const statusOrder: ProductionStatus[] = [
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
    ];
    const ordered = productions
      .filter((p) => statusOrder.includes(p.status))
      .sort(
        (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
      );

    for (const prod of ordered) {
      if (restante <= 0) break;
      const qty = Number(prod.quantityRequested);

      if (qty <= restante) {
        await tx.orderProduction.update({
          where: { id: prod.id },
          data: { status: 'CANCELED' },
        });
        restante -= qty;
      } else {
        await tx.orderProduction.update({
          where: { id: prod.id },
          data: { quantityRequested: qty - restante },
        });
        restante = 0;
      }
    }
  }
}
