import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus, Prisma, FiscalStatus } from 'generated/prisma/client';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { SendToKitchenDto } from './dto/send-to-kitchen.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Decimal } from '@prisma/client/runtime/client';
import { ConvertOrderToSaleDto } from './dto/convert-order-to-sale';

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
              ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
              ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
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
    const existingOrder = await this.findOne(id);

    // Validar se está tentando reverter status PAID
    if (
      existingOrder.status === OrderStatus.PAID &&
      updateOrderDto.status !== OrderStatus.PAID
    ) {
      throw new BadRequestException(
        'Não é possível alterar o status de um pedido já pago',
      );
    }

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

    // Buscar pedido com produtos para pegar productionLocation
    const orderWithProducts = await this.prisma.client.order.findUnique({
      where: { id },
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
      },
    });

    await this.prisma.client.$transaction(async (tx) => {
      // Atualizar pedido
      await tx.order.update({
        where: { id },
        data: { kitchenSentAt: new Date() },
      });

      // Criar registros de produção para cada item MANUFATURADO

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
            },
          });
        }
      }
    });

    return {
      orderId: id,
      kitchenSentAt: new Date(),
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

  async convertToSale(
    orderId: number,
    dto: ConvertOrderToSaleDto,
    userId: number,
    username: string,
  ) {
    // Buscar pedido com itens
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                costPrice: true,
                ncm: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    if (order.status !== OrderStatus.CLOSED) {
      throw new BadRequestException(
        'Apenas pedidos fechados podem ser convertidos em venda',
      );
    }

    // Validar cliente
    const clientId = dto.clientId || 1;
    const client = await this.prisma.client.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new BadRequestException(`Cliente ${clientId} não encontrado`);
    }

    // Calcular valores
    const discount = new Decimal(Number(dto.discount));
    const totalProductsWithoutDiscount = new Decimal(order.total);
    const total = totalProductsWithoutDiscount.minus(discount);

    // Calcular lucro
    const profitSale = order.items.reduce((acc, item) => {
      const itemCost = new Decimal(item.product.costPrice).times(
        new Decimal(item.quantity),
      );
      const itemRevenue = new Decimal(item.total);
      return acc.plus(itemRevenue.minus(itemCost));
    }, new Decimal(0));

    // Criar venda em transação
    const sale = await this.prisma.client.$transaction(async (tx) => {
      // Criar venda
      const createdSale = await tx.sale.create({
        data: {
          clientId,
          userOperator: username,
          operatorId: userId,
          date: new Date(),
          paymentMethod: dto.paymentMethod,
          totalProductsWithoutDiscount,
          discount,
          total,
          profitSale: profitSale.minus(discount),
          isPaid: clientId !== 1,
          cfop: dto.cfop,
          fiscalStatus: FiscalStatus.PENDENTE,
          items: {
            create: order.items.map((item, index) => ({
              itemNumber: index + 1,
              productId: item.productId,
              xProd: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.total,
              taxUnit: item.product.unit,
              taxQuantity: item.quantity,
              taxUnitPrice: item.unitPrice,
              composesTotal: 1,
              cfop: dto.cfop,
              totalTaxValue: null,
              importTaxValue: new Decimal(0),
              iofValue: new Decimal(0),
            })),
          },
        },
        include: {
          items: true,
          client: true,
          operator: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      });

      // Atualizar status do pedido
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });

      return createdSale;
    });

    return {
      ...sale,
      address: order.address,
    };
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
