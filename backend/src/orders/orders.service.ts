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

    // Validar operador se foi enviado
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

    // Validar produtos
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
            })),
          },
        },
        include: {
          items: true,
          operator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      return this.mapToEntity(order);
    } catch (error) {
      // Tratamento de erros do Prisma
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
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(location && { locationId: location }),
      ...(type && { type }),
      ...(table && { table: { contains: table } }),
      ...(searchName && { customerName: { contains: searchName } }),
      ...(searchId && { id: searchId }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          operator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
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
        operator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
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
  ): Promise<OrderEntity> {
    await this.findOne(id); // Valida se existe

    const { items, ...orderData } = updateOrderDto;

    // Se items foi enviado, atualiza
    const updateData: Prisma.OrderUpdateInput = {
      ...orderData,
    };

    if (items && items.length > 0) {
      // Validar produtos se items foram enviados
      const productIds = items
        .map((item) => item.productId)
        .filter((id): id is number => id !== undefined);

      if (productIds.length > 0) {
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
      }

      // Remove items antigos e cria novos
      updateData.items = {
        deleteMany: {},
        create: items.map((item) => ({
          productId: item.productId!,
          code: item.code!,
          name: item.name!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          total: item.total!,
        })),
      };
    }

    const order = await this.prisma.client.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        operator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return this.mapToEntity(order);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Valida se existe

    await this.prisma.client.order.delete({
      where: { id },
    });
  }

  async sendToKitchen(id: number, _sendToKitchenDto: SendToKitchenDto) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser enviados para cozinha',
      );
    }

    if (order.kitchenSentAt) {
      throw new BadRequestException('Pedido já foi enviado para cozinha');
    }

    const updatedOrder = await this.prisma.client.order.update({
      where: { id },
      data: {
        kitchenSentAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    // TODO: Criar OrderProduction aqui no futuro
    // Para cada item, criar um registro em OrderProduction
    // com productionLocation copiado de Product

    return {
      orderId: updatedOrder.id,
      kitchenSentAt: updatedOrder.kitchenSentAt,
      message: 'Pedido enviado para cozinha com sucesso',
    };
  }

  async cancel(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser cancelados',
      );
    }

    const canceledOrder = await this.prisma.client.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELED,
      },
      include: {
        items: true,
        operator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return this.mapToEntity(canceledOrder);
  }

  async markReady(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser marcados como prontos',
      );
    }

    if (!order.kitchenSentAt) {
      throw new BadRequestException(
        'Pedido precisa ser enviado para cozinha primeiro',
      );
    }

    // Verificar se todos items estão prontos
    const allItemsReady = order.items.every(
      (item) => item.kitchenReadyAt !== null,
    );

    if (!allItemsReady) {
      throw new BadRequestException('Nem todos os itens estão prontos');
    }

    const readyOrder = await this.prisma.client.order.update({
      where: { id },
      data: {
        kitchenReadyAt: new Date(),
      },
      include: {
        items: true,
        operator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return this.mapToEntity(readyOrder);
  }

  async finish(id: number) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser finalizados',
      );
    }

    if (!order.kitchenReadyAt) {
      throw new BadRequestException(
        'Pedido precisa estar pronto antes de finalizar',
      );
    }

    // TODO: Implementar conversão Order -> Sale
    // 1. Buscar ou criar Client
    // 2. Criar Sale com dados fiscais
    // 3. Criar SaleItems com impostos
    // 4. Atualizar Order.status = CLOSED
    // 5. Atualizar Order.finishedAt

    throw new BadRequestException(
      'Conversão Order -> Sale ainda não implementada',
    );
  }

  // Helper para converter Prisma -> Entity
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
      kitchenSentAt: order.kitchenSentAt,
      kitchenReadyAt: order.kitchenReadyAt,
      finishedAt: order.finishedAt,
      deliveredAt: order.deliveredAt,
      tableOccupiedUtil: order.tableOccupiedUtil,
      operatorId: order.operatorId,
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
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })) || [],
    };
  }
}
