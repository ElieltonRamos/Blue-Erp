import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';

type TxClient = Prisma.TransactionClient;
type Numeric = number | Prisma.Decimal;

@Injectable()
export class OrderStockService {
  async decrement(
    tx: TxClient,
    productId: number,
    quantity: Numeric,
  ): Promise<void> {
    await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: Number(quantity) } },
    });
  }

  async increment(
    tx: TxClient,
    productId: number,
    quantity: Numeric,
  ): Promise<void> {
    await tx.product.update({
      where: { id: productId },
      data: { quantity: { increment: Number(quantity) } },
    });
  }
}
