import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus, Prisma } from 'generated/prisma/client';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { SendToKitchenDto } from './dto/send-to-kitchen.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    const { items, operatorId, ...orderData } = createOrderDto;

    if (operatorId) {
      const operator = await this.prisma.client.user.findUnique({
        where: { id: operatorId },
      });
      if (!operator) {
        throw new BadRequestException(
          `Operador com ID ${operatorId} não encontrado`,
        );
      }
    }

    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const foundIds = products.map((p) => p.id);
    const missingIds = productIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Produtos não encontrados: ${missingIds.join(', ')}`,
      );
    }

    try {
      const order = await this.prisma.client.order.create({
        data: {
          ...orderData,
          ...(operatorId && { operatorId }),
          status: OrderStatus.OPEN,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              code: item.code,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              observation: item.observation ?? null,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  productionLocation: true,
                  productType: true,
                },
              },
            },
          },
          operator: {
            select: { id: true, username: true, role: true },
          },
        },
      });

      const resaleItems = order.items.filter(
        (item) => item.product.productType === 'RESALE',
      );

      if (resaleItems.length > 0) {
        await this.prisma.client.$transaction(async (tx) => {
          for (const item of resaleItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        });
      }

      const manufacturedItems = order.items.filter(
        (item) => item.product.productType === 'MANUFACTURED',
      );

      if (manufacturedItems.length > 0) {
        await this.prisma.client.$transaction(async (tx) => {
          for (const item of manufacturedItems) {
            await tx.orderProduction.create({
              data: {
                orderItemId: item.id,
                productionLocation:
                  item.product.productionLocation || 'LOCAL_01',
                status: 'PENDING',
                quantityRequested: item.quantity,
                quantityProduced: 0,
                pendingAt: new Date(),
                observation: item.observation ?? null,
              },
            });
          }
        });
      }

      return this.mapToEntity(order);
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Erro de chave estrangeira: Verifique se os dados relacionados existem',
        );
      }
      throw error;
    }
  }

  async findAll(filters: OrderFiltersDto) {
    const {
      page = 1,
      limit = 10,
      status,
      location,
      type,
      table,
      searchName,
      searchId,
      startDate,
      endDate,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(location && { locationId: location }),
      ...(type && { type }),
      ...(table && { table: { contains: table } }),
      ...(searchName && { customerName: { contains: searchName } }),
      ...(searchId && { id: searchId }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && {
                gte: new Date(`${startDate}T00:00:00.000-03:00`),
              }),
              ...(endDate && {
                lte: new Date(`${endDate}T23:59:59.999-03:00`),
              }),
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          operator: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.mapToEntity(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    return this.mapToEntity(order);
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    userRole: string,
  ): Promise<OrderEntity> {
    const existingOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productions: true,
            product: {
              select: {
                id: true,
                productType: true,
                productionLocation: true,
              },
            },
          },
        },
        operator: { select: { id: true, username: true, role: true } },
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (existingOrder.status === OrderStatus.PAID) {
      throw new BadRequestException(
        'Pedido já foi pago e não pode ser alterado',
      );
    }

    if (existingOrder.status === OrderStatus.CANCELED) {
      const { status } = updateOrderDto;
      if (!status || status === OrderStatus.CANCELED) {
        throw new BadRequestException(
          'Pedido cancelado só permite atualizar o status',
        );
      }

      const updatedOrder = await this.prisma.client.order.update({
        where: { id },
        data: { status },
        include: {
          items: true,
          operator: { select: { id: true, username: true, role: true } },
        },
      });

      return this.mapToEntity(updatedOrder);
    }

    const isInProduction = existingOrder.items.some((item) =>
      item.productions.some((p) => p.status !== 'CANCELED'),
    );

    const { items, ...orderData } = updateOrderDto;

    await this.prisma.client.$transaction(async (tx) => {
      let totalPedido = 0;

      if (!items) {
        totalPedido = Number(existingOrder.total);
        await tx.order.update({
          where: { id },
          data: { ...orderData, total: totalPedido },
        });
        return;
      }

      const existingItems = existingOrder.items;
      const incomingIds = items.filter((i) => i.id).map((i) => i.id!);

      const removedItems = existingItems.filter(
        (item) => !incomingIds.includes(item.id),
      );

      if (removedItems.length > 0 && !['admin', 'caixa'].includes(userRole)) {
        throw new BadRequestException(
          'Apenas admin e caixa podem remover itens do pedido',
        );
      }

      // Remoção de itens
      for (const item of existingItems) {
        if (incomingIds.includes(item.id)) continue;

        if (item.product.productType === 'MANUFACTURED') {
          const hasInProgressProduction = item.productions.some(
            (p) => p.status === 'IN_PROGRESS',
          );

          if (hasInProgressProduction) {
            throw new BadRequestException(
              `Item "${item.name}" está em produção e não pode ser removido`,
            );
          }

          const hasStartedProduction = item.productions.some(
            (p) => p.status !== 'CANCELED' && Number(p.quantityProduced) > 0,
          );

          if (hasStartedProduction) {
            throw new BadRequestException(
              `Item "${item.name}" já iniciou produção e não pode ser removido`,
            );
          }

          await tx.orderProduction.updateMany({
            where: { orderItemId: item.id, status: 'PENDING' },
            data: { status: 'CANCELED' },
          });
        }

        await tx.orderItem.delete({ where: { id: item.id } });

        if (item.product.productType === 'RESALE') {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      // Atualização de itens existentes
      for (const incoming of items.filter((i) => i.id)) {
        const existing = existingItems.find((i) => i.id === incoming.id);
        if (!existing) continue;

        const novaQuantidade = Number(incoming.quantity);
        const quantidadeAtual = Number(existing.quantity);
        const novoPreco = Number(incoming.unitPrice);
        const precoAtual = Number(existing.unitPrice);

        if (isInProduction && novoPreco !== precoAtual) {
          throw new BadRequestException(
            `Não é permitido alterar o preço do item "${existing.name}" após envio à cozinha`,
          );
        }

        if (novaQuantidade > quantidadeAtual) {
          const diferenca = novaQuantidade - quantidadeAtual;

          if (existing.product.productType === 'MANUFACTURED') {
            await tx.orderProduction.create({
              data: {
                orderItemId: existing.id,
                productionLocation:
                  existing.product.productionLocation || 'LOCAL_01',
                status: 'PENDING',
                quantityRequested: diferenca,
                quantityProduced: 0,
                pendingAt: new Date(),
                observation: existing.observation ?? null,
              },
            });
          }
        }

        if (novaQuantidade < quantidadeAtual) {
          if (existing.product.productType === 'MANUFACTURED') {
            const pendingProductions = existing.productions.filter(
              (p) => p.status === 'PENDING',
            );

            let restanteParaCancelar = quantidadeAtual - novaQuantidade;

            for (const prod of pendingProductions) {
              if (restanteParaCancelar <= 0) break;

              const qty = Number(prod.quantityRequested);

              if (qty <= restanteParaCancelar) {
                await tx.orderProduction.update({
                  where: { id: prod.id },
                  data: { status: 'CANCELED' },
                });
                restanteParaCancelar -= qty;
              } else {
                await tx.orderProduction.update({
                  where: { id: prod.id },
                  data: { quantityRequested: qty - restanteParaCancelar },
                });
                restanteParaCancelar = 0;
              }
            }

            if (restanteParaCancelar > 0) {
              throw new BadRequestException(
                `Não é possível reduzir "${existing.name}" pois parte já está em produção`,
              );
            }
          }
        }

        const totalItem = novaQuantidade * precoAtual;
        totalPedido += totalItem;

        await tx.orderItem.update({
          where: { id: existing.id },
          data: {
            quantity: novaQuantidade,
            total: totalItem,
            observation: incoming.observation ?? existing.observation ?? null,
          },
        });

        // Sincroniza observation nas produções pendentes
        if (
          incoming.observation !== undefined &&
          incoming.observation !== existing.observation
        ) {
          await tx.orderProduction.updateMany({
            where: { orderItemId: existing.id, status: 'PENDING' },
            data: { observation: incoming.observation ?? null },
          });
        }

        if (existing.product.productType === 'RESALE') {
          const diferenca = novaQuantidade - quantidadeAtual;
          if (diferenca > 0) {
            await tx.product.update({
              where: { id: existing.productId },
              data: { quantity: { decrement: diferenca } },
            });
          } else if (diferenca < 0) {
            await tx.product.update({
              where: { id: existing.productId },
              data: { quantity: { increment: Math.abs(diferenca) } },
            });
          }
        }
      }

      // Novos itens
      const newItems = items.filter((i) => !i.id);

      if (newItems.length > 0) {
        const productIds = newItems.map((i) => i.productId);

        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, productType: true, productionLocation: true },
        });

        for (const newItem of newItems) {
          const product = products.find((p) => p.id === newItem.productId);

          if (!product) {
            throw new BadRequestException(
              `Produto ${newItem.productId} não encontrado`,
            );
          }

          if (
            newItem.quantity === undefined ||
            newItem.unitPrice === undefined
          ) {
            throw new BadRequestException(
              `Produto ${newItem.productId} com erro de cadastro`,
            );
          }

          const totalItem = newItem.quantity * newItem.unitPrice;
          totalPedido += totalItem;

          const createdItem = await tx.orderItem.create({
            data: {
              orderId: id,
              productId: newItem.productId,
              code: newItem.code!,
              name: newItem.name!,
              quantity: newItem.quantity,
              unitPrice: newItem.unitPrice,
              total: totalItem,
              observation: newItem.observation ?? null,
            },
          });

          if (product.productType === 'RESALE') {
            await tx.product.update({
              where: { id: newItem.productId },
              data: { quantity: { decrement: newItem.quantity } },
            });
          }

          if (product.productType === 'MANUFACTURED') {
            await tx.orderProduction.create({
              data: {
                orderItemId: createdItem.id,
                productionLocation: product.productionLocation || 'LOCAL_01',
                status: 'PENDING',
                quantityRequested: createdItem.quantity,
                quantityProduced: 0,
                pendingAt: new Date(),
                observation: newItem.observation ?? null,
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id },
        data: { ...orderData, total: totalPedido },
      });
    });

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
      },
    });

    return this.mapToEntity(updated!);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.order.delete({ where: { id } });
  }

  async sendToKitchen(id: number, _sendToKitchenDto: SendToKitchenDto) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser enviados para cozinha',
      );
    }

    const orderWithProducts = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productions: true,
            product: {
              select: { id: true, productionLocation: true, productType: true },
            },
          },
        },
      },
    });

    if (!orderWithProducts) {
      throw new BadRequestException('Pedido não encontrado');
    }

    const alreadyInProduction = orderWithProducts.items.some((item) =>
      item.productions.some((p) => p.status !== 'CANCELED'),
    );

    if (alreadyInProduction) {
      throw new BadRequestException('Pedido já possui itens em produção');
    }

    await this.prisma.client.$transaction(async (tx) => {
      if (orderWithProducts === null) {
        throw new BadRequestException('Lista de pedidos vazia');
      }

      for (const item of orderWithProducts.items) {
        if (item.product.productType === 'MANUFACTURED') {
          await tx.orderProduction.create({
            data: {
              orderItemId: item.id,
              productionLocation: item.product.productionLocation || 'LOCAL_01',
              status: 'PENDING',
              quantityRequested: item.quantity,
              quantityProduced: 0,
              pendingAt: new Date(),
              observation: item.observation ?? null,
            },
          });
        }
      }
    });

    return {
      orderId: id,
      message: 'Pedido enviado para cozinha com sucesso',
    };
  }

  async cancel(id: number): Promise<OrderEntity> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: { include: { productions: true, product: true } },
        operator: { select: { id: true, username: true, role: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser cancelados',
      );
    }

    await this.prisma.client.$transaction(async (tx) => {
      for (const item of order.items) {
        const pendingProductions = item.productions.filter(
          (p) => p.status === 'PENDING',
        );

        const hasProduced = item.productions.some(
          (p) => p.status === 'IN_PROGRESS' || Number(p.quantityProduced) > 0,
        );

        if (pendingProductions.length > 0 && !hasProduced) {
          await tx.orderProduction.updateMany({
            where: { orderItemId: item.id, status: 'PENDING' },
            data: { status: 'CANCELED' },
          });

          await tx.orderItem.delete({ where: { id: item.id } });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELED },
      });
    });

    const canceledOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
      },
    });

    return this.mapToEntity(canceledOrder!);
  }

  private mapToEntity(order: any): OrderEntity {
    return {
      id: order.id,
      type: order.type,
      locationId: order.locationId,
      customerName: order.customerName,
      table: order.table,
      address: order.address,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      finishedAt: order.finishedAt,
      tableOccupiedUntil: order.tableOccupiedUntil,
      operatorId: order.operatorId,
      closedByOperatorId: order.closedByOperatorId,
      items:
        order.items?.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          kitchenReadyAt: item.kitchenReadyAt,
          orderId: item.orderId,
          productId: item.productId,
          observation: item.observation ?? null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })) || [],
    };
  }
}
