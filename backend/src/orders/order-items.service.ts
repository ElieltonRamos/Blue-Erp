import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, ProductType } from 'generated/prisma/client';
import { OrderProductionService } from './order-production.service';
import { OrderStockService } from './order-stock.service';
import { PrintJobBuilder } from './order-print.service';
import { UpdateOrderItemDto } from './dto/update-order.dto';
import { resolveLogicalDateTime } from '../common/date-utils';

type TxClient = Prisma.TransactionClient;

export type ExistingOrderItem = Prisma.OrderItemGetPayload<{
  include: {
    productions: true;
    product: {
      select: { id: true; productType: true; productionLocation: true };
    };
  };
}>;

@Injectable()
export class OrderItemsService {
  private readonly logger = new Logger(OrderItemsService.name);

  constructor(
    private readonly productionService: OrderProductionService,
    private readonly stockService: OrderStockService,
  ) {}

  async handleRemovedItems(
    tx: TxClient,
    existingItems: ExistingOrderItem[],
    incomingIds: number[],
    userRole: string,
  ): Promise<void> {
    const removedItems = existingItems.filter(
      (item) => !incomingIds.includes(item.id),
    );

    if (removedItems.length === 0) return;

    if (!['admin', 'caixa'].includes(userRole)) {
      this.logger.warn(
        `Tentativa de remover itens de pedido sem permissão (papel: ${userRole})`,
      );
      throw new BadRequestException(
        'Apenas admin e caixa podem remover itens do pedido',
      );
    }

    for (const item of removedItems) {
      // TODO: itens com produções COMPLETED que forem removidos representam uma perda real
      // (produto já produzido e não cobrado). Considerar inserir registro em tabela de perdas
      // com: itemId, productId, quantity, unitPrice, operatorId, motivo.
      if (this.productionService.isProduced(item.product.productType)) {
        await this.productionService.cancelActiveByOrderItem(tx, item.id);
      }

      await tx.orderItem.delete({ where: { id: item.id } });

      if (item.product.productType === ProductType.RESALE) {
        await this.stockService.increment(tx, item.productId, item.quantity);
      }
    }
  }

  async handleUpdatedItems(
    tx: TxClient,
    items: UpdateOrderItemDto[],
    existingItems: ExistingOrderItem[],
    printBuilder: PrintJobBuilder,
  ): Promise<number> {
    let total = 0;

    for (const incoming of items.filter((i) => i.id !== undefined)) {
      const existing = existingItems.find((i) => i.id === incoming.id);
      if (!existing) continue;

      const novaQuantidade = Number(incoming.quantity);
      const quantidadeAtual = Number(existing.quantity);
      const novoPreco = Number(incoming.unitPrice);
      const precoAtual = Number(existing.unitPrice);
      const diferenca = novaQuantidade - quantidadeAtual;

      if (diferenca > 0) {
        if (this.productionService.isProduced(existing.product.productType)) {
          await this.productionService.create(tx, {
            orderItemId: existing.id,
            productionLocation: existing.product.productionLocation,
            quantityRequested: diferenca,
            observation: incoming.observation ?? existing.observation,
            pendingAt: resolveLogicalDateTime(),
          });
          printBuilder.addItem(
            existing.product.productionLocation || 'LOCAL_01',
            {
              name: existing.name,
              quantity: diferenca,
              observation:
                incoming.observation ?? existing.observation ?? undefined,
            },
          );
        }
        if (existing.product.productType === ProductType.RESALE) {
          await this.stockService.decrement(tx, existing.productId, diferenca);
          printBuilder.addItemIfLocation(existing.product.productionLocation, {
            name: existing.name,
            quantity: diferenca,
            observation:
              incoming.observation ?? existing.observation ?? undefined,
          });
        }
      }

      if (diferenca < 0) {
        if (this.productionService.isProduced(existing.product.productType)) {
          await this.productionService.reduceQuantity(
            tx,
            existing.productions,
            Math.abs(diferenca),
          );
        }

        if (existing.product.productType === ProductType.RESALE) {
          await this.stockService.increment(
            tx,
            existing.productId,
            Math.abs(diferenca),
          );
        }
      }

      const precoFinal = novoPreco !== precoAtual ? novoPreco : precoAtual;
      const totalItem = novaQuantidade * precoFinal;
      total += totalItem;

      await tx.orderItem.update({
        where: { id: existing.id },
        data: {
          quantity: novaQuantidade,
          unitPrice: precoFinal,
          total: totalItem,
          serviceCharge: incoming.serviceCharge ?? 0,
          observation: incoming.observation ?? existing.observation ?? null,
        },
      });
    }

    return total;
  }

  async handleNewItems(
    tx: TxClient,
    newItems: UpdateOrderItemDto[],
    orderId: number,
    operatorId: number,
    printBuilder: PrintJobBuilder,
  ): Promise<number> {
    if (newItems.length === 0) return 0;

    let total = 0;

    const products = await tx.product.findMany({
      where: { id: { in: newItems.map((i) => i.productId) } },
      select: { id: true, productType: true, productionLocation: true },
    });

    for (const newItem of newItems) {
      const product = products.find((p) => p.id === newItem.productId);

      if (!product) {
        throw new BadRequestException(
          `Produto ${newItem.productId} não encontrado`,
        );
      }

      if (newItem.quantity === undefined || newItem.unitPrice === undefined) {
        throw new BadRequestException(
          `Produto ${newItem.productId} com erro de cadastro`,
        );
      }

      const totalItem = newItem.quantity * newItem.unitPrice;
      total += totalItem;

      const createdItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: newItem.productId,
          code: newItem.code!,
          name: newItem.name!,
          quantity: newItem.quantity,
          unitPrice: newItem.unitPrice,
          total: totalItem,
          serviceCharge: newItem.serviceCharge ?? 0,
          operatorId,
          observation: newItem.observation ?? null,
        },
      });

      if (product.productType === ProductType.RESALE) {
        await this.stockService.decrement(
          tx,
          newItem.productId,
          newItem.quantity,
        );
        printBuilder.addItemIfLocation(product.productionLocation, {
          name: newItem.name!,
          quantity: newItem.quantity,
          observation: newItem.observation,
        });
      }

      if (this.productionService.isProduced(product.productType)) {
        await this.productionService.create(tx, {
          orderItemId: createdItem.id,
          productionLocation: product.productionLocation,
          quantityRequested: createdItem.quantity,
          observation: newItem.observation,
          pendingAt: resolveLogicalDateTime(),
        });
        printBuilder.addItem(product.productionLocation || 'LOCAL_01', {
          name: newItem.name!,
          quantity: newItem.quantity,
          observation: newItem.observation,
        });
      }
    }

    return total;
  }
}
