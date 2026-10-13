import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus, ProductType } from 'generated/prisma/client';
import { RemoveOrderItemsDto } from './dto/remove-order-items.dto';
import { resolveLogicalDateTime } from '../common/date-utils';
import { OrderProductionService } from './order-production.service';
import { OrderStockService } from './order-stock.service';
import { OrderPrintService } from './order-print.service';
import {
  mapOrderToEntity,
  ORDER_INCLUDE_BASIC,
  ORDER_INCLUDE_ITEMS_FULL,
} from './order.mapper';
import { AddOrderItemsDto } from './dto/add-order-itens.dto';
import { UpdateServiceChargeDto } from './dto/update-service-charge.dto';

@Injectable()
export class OrderItemsService {
  private readonly logger = new Logger(OrderItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productionService: OrderProductionService,
    private readonly stockService: OrderStockService,
    private readonly printService: OrderPrintService,
  ) {}

  /**
   * Único caminho para reduzir quantidade ou remover um item por completo.
   * A quantidade recebida é sempre um DELTA a decrementar sobre o valor
   * atual do banco — nunca um valor final — para não sofrer com estado
   * desatualizado no client (duas sessões abertas na mesma comanda).
   * Se o decremento zerar ou passar de zero, o item é removido por completo.
   */
  async removeItems(
    id: number,
    dto: RemoveOrderItemsDto,
    userRole: string,
    operatorId: number,
  ): Promise<OrderEntity> {
    const start = Date.now();
    const tag = `Pedido ${id}`;
    const requests = dto.items;

    this.logger.log(
      `[${tag}] operador=${operatorId} role=${userRole} | solicitando redução/remoção: ` +
        requests.map((r) => `${r.id}(-${r.quantity})`).join(', '),
    );

    // Fix: quantity sempre deve ser um delta positivo. Sem essa validação,
    // um valor negativo/zero fazia novaQuantidade AUMENTAR dentro de um
    // método que só deveria reduzir/remover — sem passar pelas regras de
    // addItems (sem criar produção, sem baixar estoque).
    for (const req of requests) {
      if (!Number.isFinite(req.quantity) || req.quantity <= 0) {
        throw new BadRequestException(
          `Quantidade inválida para o item ${req.id}: deve ser um número positivo`,
        );
      }
    }

    const existingOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_ITEMS_FULL,
    });

    if (!existingOrder) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (existingOrder.status === OrderStatus.PAID) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: pedido já pago`,
      );
      throw new BadRequestException(
        'Pedido já foi pago e não pode ser alterado',
      );
    }

    if (existingOrder.status === OrderStatus.CANCELED) {
      throw new BadRequestException(
        'Pedido cancelado não permite alteração de itens',
      );
    }

    if (!['admin', 'caixa'].includes(userRole)) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | Tentativa de remover/reduzir itens sem permissão (papel: ${userRole})`,
      );
      throw new BadRequestException(
        'Apenas admin e caixa podem remover ou reduzir itens do pedido',
      );
    }

    const removedItems: typeof existingOrder.items = [];
    let remainingItemsTotal = 0;

    await this.prisma.client.$transaction(async (tx) => {
      for (const req of requests) {
        const existing = existingOrder.items.find((i) => i.id === req.id);
        if (!existing) {
          throw new BadRequestException(
            `Item ${req.id} não encontrado no pedido`,
          );
        }

        const quantidadeAtual = Number(existing.quantity);
        const quantidadeARemover = Number(req.quantity);
        const novaQuantidade = quantidadeAtual - quantidadeARemover;

        if (novaQuantidade <= 0) {
          if (this.productionService.isProduced(existing.product.productType)) {
            await this.productionService.cancelActiveByOrderItem(
              tx,
              existing.id,
            );
          }

          await tx.orderItem.delete({ where: { id: existing.id } });

          if (existing.product.productType === ProductType.RESALE) {
            await this.stockService.increment(
              tx,
              existing.productId,
              quantidadeAtual,
            );
          }

          removedItems.push(existing);
        } else {
          if (this.productionService.isProduced(existing.product.productType)) {
            await this.productionService.reduceQuantity(
              tx,
              existing.productions,
              quantidadeARemover,
            );
          }

          if (existing.product.productType === ProductType.RESALE) {
            await this.stockService.increment(
              tx,
              existing.productId,
              quantidadeARemover,
            );
          }

          const totalItem = novaQuantidade * Number(existing.unitPrice);
          remainingItemsTotal += totalItem;

          await tx.orderItem.update({
            where: { id: existing.id },
            data: { quantity: novaQuantidade, total: totalItem },
          });
        }
      }

      const untouchedTotal = existingOrder.items
        .filter(
          (i) =>
            !requests.some((r) => r.id === i.id) &&
            !removedItems.some((r) => r.id === i.id),
        )
        .reduce((sum, i) => sum + Number(i.total), 0);

      await tx.order.update({
        where: { id },
        data: { total: untouchedTotal + remainingItemsTotal },
      });
    });

    if (removedItems.length > 0) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} role=${userRole} | removidos por completo ${removedItems.length} item(ns): ` +
          removedItems.map((i) => `${i.id}:${i.name}`).join(', '),
      );
    }

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_BASIC,
    });

    this.logger.log(
      `[${tag}] operador=${operatorId} | reduzido/removido em ${Date.now() - start}ms | itens finais: ` +
        (updated?.items
          .map((i) => `${i.id}:${i.name}(x${Number(i.quantity)})`)
          .join(', ') || 'nenhum'),
    );

    return mapOrderToEntity(updated!);
  }

  /**
   * Único caminho para adicionar itens à comanda. A quantidade recebida é
   * sempre um DELTA a somar — nunca um valor final. Se já existir um item
   * na comanda com o mesmo productId, soma a quantidade na linha existente;
   * caso contrário, cria uma linha nova.
   *
   * unitPrice: quando o item já existe, o total é recalculado com
   * existing.unitPrice (preço travado na criação do item) — incoming.unitPrice
   * é ignorado de propósito nesse caso, por decisão confirmada.
   */
  async addItems(
    id: number,
    dto: AddOrderItemsDto,
    operatorId: number,
  ): Promise<OrderEntity> {
    const start = Date.now();
    const tag = `Pedido ${id}`;
    const newItems = dto.items;

    this.logger.log(
      `[${tag}] operador=${operatorId} | adicionando ${newItems.length} item(ns): ` +
        newItems.map((i) => `produto ${i.productId} x${i.quantity}`).join(', '),
    );

    const existingOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_ITEMS_FULL,
    });

    if (!existingOrder) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (existingOrder.status === OrderStatus.PAID) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: pedido já pago`,
      );
      throw new BadRequestException(
        'Pedido já foi pago e não pode ser alterado',
      );
    }

    if (existingOrder.status === OrderStatus.CANCELED) {
      throw new BadRequestException(
        'Pedido cancelado não permite adição de itens',
      );
    }

    const currentOperator = await this.prisma.client.user.findUnique({
      where: { id: operatorId },
      select: { username: true },
    });

    const printBuilder = this.printService.createBuilder({
      orderId: id,
      table: existingOrder.table,
      customerName: existingOrder.customerName,
      operatorName: currentOperator?.username,
    });

    const products = await this.prisma.client.product.findMany({
      where: { id: { in: newItems.map((i) => i.productId) } },
      select: { id: true, productType: true, productionLocation: true },
    });

    let addedOrIncreasedTotal = 0;

    await this.prisma.client.$transaction(async (tx) => {
      for (const incoming of newItems) {
        const product = products.find((p) => p.id === incoming.productId);

        if (!product) {
          throw new BadRequestException(
            `Produto ${incoming.productId} não encontrado`,
          );
        }

        if (
          incoming.quantity === undefined ||
          incoming.unitPrice === undefined
        ) {
          throw new BadRequestException(
            `Produto ${incoming.productId} com erro de cadastro`,
          );
        }

        const existing = existingOrder.items.find(
          (i) => i.productId === incoming.productId,
        );

        if (existing) {
          const novaQuantidade = Number(existing.quantity) + incoming.quantity;
          const totalItem = novaQuantidade * Number(existing.unitPrice);
          addedOrIncreasedTotal += totalItem;

          if (this.productionService.isProduced(product.productType)) {
            await this.productionService.create(tx, {
              orderItemId: existing.id,
              productionLocation: product.productionLocation,
              quantityRequested: incoming.quantity,
              observation: incoming.observation ?? existing.observation,
              pendingAt: resolveLogicalDateTime(),
            });
            printBuilder.addItem(product.productionLocation || 'LOCAL_01', {
              name: existing.name,
              quantity: incoming.quantity,
              observation:
                incoming.observation ?? existing.observation ?? undefined,
            });
          }

          if (product.productType === ProductType.RESALE) {
            await this.stockService.decrement(
              tx,
              incoming.productId,
              incoming.quantity,
            );
            printBuilder.addItemIfLocation(product.productionLocation, {
              name: existing.name,
              quantity: incoming.quantity,
              observation:
                incoming.observation ?? existing.observation ?? undefined,
            });
          }

          await tx.orderItem.update({
            where: { id: existing.id },
            data: {
              quantity: novaQuantidade,
              total: totalItem,
              observation: incoming.observation ?? existing.observation ?? null,
            },
          });
        } else {
          const totalItem = incoming.quantity * incoming.unitPrice;
          addedOrIncreasedTotal += totalItem;

          const createdItem = await tx.orderItem.create({
            data: {
              orderId: id,
              productId: incoming.productId,
              code: incoming.code!,
              name: incoming.name!,
              quantity: incoming.quantity,
              unitPrice: incoming.unitPrice,
              total: totalItem,
              serviceCharge: incoming.serviceCharge ?? 0,
              operatorId,
              observation: incoming.observation ?? null,
            },
          });

          if (product.productType === ProductType.RESALE) {
            await this.stockService.decrement(
              tx,
              incoming.productId,
              incoming.quantity,
            );
            printBuilder.addItemIfLocation(product.productionLocation, {
              name: incoming.name!,
              quantity: incoming.quantity,
              observation: incoming.observation,
            });
          }

          if (this.productionService.isProduced(product.productType)) {
            await this.productionService.create(tx, {
              orderItemId: createdItem.id,
              productionLocation: product.productionLocation,
              quantityRequested: createdItem.quantity,
              observation: incoming.observation,
              pendingAt: resolveLogicalDateTime(),
            });
            printBuilder.addItem(product.productionLocation || 'LOCAL_01', {
              name: incoming.name!,
              quantity: incoming.quantity,
              observation: incoming.observation,
            });
          }
        }
      }

      const untouchedTotal = existingOrder.items
        .filter((i) => !newItems.some((n) => n.productId === i.productId))
        .reduce((sum, i) => sum + Number(i.total), 0);

      await tx.order.update({
        where: { id },
        data: { total: untouchedTotal + addedOrIncreasedTotal },
      });
    });

    this.logger.log(
      `[${tag}] operador=${operatorId} | transação concluída, despachando impressão para ${printBuilder.map.size} local(is): ` +
        [...printBuilder.map.entries()]
          .map(
            ([loc, job]) =>
              `${loc}[${job.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}]`,
          )
          .join(' | '),
    );

    this.printService.dispatchAsync(id, printBuilder.map);

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_BASIC,
    });

    this.logger.log(
      `[${tag}] operador=${operatorId} | adicionado em ${Date.now() - start}ms | itens finais: ` +
        updated?.items
          .map((i) => `${i.id}:${i.name}(x${Number(i.quantity)})`)
          .join(', '),
    );

    return mapOrderToEntity(updated!);
  }

  /**
   * Único caminho para atualizar a taxa de serviço do pedido e distribuí-la
   * entre os itens.
   *
   * enabled=false: zera serviceCharge de todos os itens e do pedido.
   * enabled=true e amount bate com 10% da soma dos itens (orderTotal * 0.1,
   * arredondado a 2 casas): modo "padrão" — cada item recebe item.total * 0.1.
   * enabled=true com amount customizado: divide igualmente entre os itens
   * (amount / quantidade de itens).
   */
  async updateServiceCharge(
    id: number,
    dto: UpdateServiceChargeDto,
    operatorId: number,
  ): Promise<OrderEntity> {
    const start = Date.now();
    const tag = `Pedido ${id}`;

    this.logger.log(
      `[${tag}] operador=${operatorId} | atualizando taxa de serviço: enabled=${dto.enabled} amount=${dto.amount}`,
    );

    const existingOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_ITEMS_FULL,
    });

    if (!existingOrder) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (existingOrder.status === OrderStatus.PAID) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | bloqueado: pedido já pago`,
      );
      throw new BadRequestException(
        'Pedido já foi pago e não pode ser alterado',
      );
    }

    if (existingOrder.status === OrderStatus.CANCELED) {
      throw new BadRequestException(
        'Pedido cancelado não permite alteração de taxa de serviço',
      );
    }

    const items = existingOrder.items;
    let perItemCharges: { id: number; serviceCharge: number }[];
    let finalServiceCharge: number;

    if (!dto.enabled || items.length === 0) {
      perItemCharges = items.map((i) => ({ id: i.id, serviceCharge: 0 }));
      finalServiceCharge = 0;
    } else {
      const orderTotal = items.reduce((sum, i) => sum + Number(i.total), 0);
      const defaultAmount = Number((orderTotal * 0.1).toFixed(2));
      const isDefault = Number(dto.amount.toFixed(2)) === defaultAmount;

      if (isDefault) {
        perItemCharges = items.map((i) => ({
          id: i.id,
          serviceCharge: Number((Number(i.total) * 0.1).toFixed(2)),
        }));
      } else {
        const perItem = Number((dto.amount / items.length).toFixed(2));
        perItemCharges = items.map((i) => ({
          id: i.id,
          serviceCharge: perItem,
        }));
      }

      finalServiceCharge = perItemCharges.reduce(
        (sum, i) => sum + i.serviceCharge,
        0,
      );
    }

    await this.prisma.client.$transaction(async (tx) => {
      for (const charge of perItemCharges) {
        await tx.orderItem.update({
          where: { id: charge.id },
          data: { serviceCharge: charge.serviceCharge },
        });
      }

      await tx.order.update({
        where: { id },
        data: { serviceCharge: finalServiceCharge },
      });
    });

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_BASIC,
    });

    this.logger.log(
      `[${tag}] operador=${operatorId} | taxa de serviço atualizada em ${Date.now() - start}ms | total=${finalServiceCharge}`,
    );

    return mapOrderToEntity(updated!);
  }
}
