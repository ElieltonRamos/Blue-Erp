import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus, ProductType, Prisma } from 'generated/prisma/client';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ReprintOrderDto } from './dto/reprint-order.dto';
import { resolveLogicalDateTime } from '../common/date-utils';
import { OrderProductionService } from './order-production.service';
import { OrderStockService } from './order-stock.service';
import { OrderTableService } from './order-table.service';
import { OrderPrintService } from './order-print.service';
import {
  mapOrderToEntity,
  ORDER_INCLUDE_BASIC,
  ORDER_INCLUDE_FULL,
} from './order.mapper';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productionService: OrderProductionService,
    private readonly stockService: OrderStockService,
    private readonly tableService: OrderTableService,
    private readonly printService: OrderPrintService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    operatorId: number,
  ): Promise<OrderEntity> {
    const start = Date.now();

    this.logger.log(
      `[Pedido novo] operador=${operatorId} | criando com ${createOrderDto.items.length} item(ns)`,
    );

    const { items, ...orderData } = createOrderDto;

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

    const tableNumber = orderData.table
      ? this.tableService.parseTableNumber(orderData.table)
      : null;

    try {
      // Tudo dentro de UMA transação: se a mesa estiver ocupada, nada é
      // persistido (nem pedido, nem baixa de estoque, nem produção) e a
      // impressão nunca é despachada. Antes, a checagem de mesa vinha
      // depois de tudo isso já ter sido commitado em transações separadas.
      const order = await this.prisma.client.$transaction(async (tx) => {
        let tableRecord: Awaited<
          ReturnType<typeof this.tableService.findTableRecord>
        > = null;

        if (orderData.table && tableNumber !== null) {
          // NOTE: assume que findTableRecord/occupy aceitam o client de
          // transação (tx) além do PrismaClient — mesmo padrão já usado
          // por stockService/productionService. Confirmar assinatura.
          tableRecord = await this.tableService.findTableRecord(
            tx,
            orderData.table,
            orderData.locationId,
          );

          if (tableRecord?.status === 'OCCUPIED') {
            this.logger.warn(
              `[Pedido novo] operador=${operatorId} | mesa ${tableNumber} já ocupada`,
            );
            throw new BadRequestException(
              `Mesa ${tableNumber} já está ocupada`,
            );
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            ...orderData,
            createdAt: resolveLogicalDateTime(),
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
                serviceCharge: item.serviceCharge ?? 0,
                operatorId,
                observation: item.observation ?? null,
              })),
            },
          },
          include: ORDER_INCLUDE_FULL,
        });

        this.logger.log(
          `[Pedido ${createdOrder.id}] operador=${operatorId} | persistido com ${createdOrder.items.length} item(ns): ` +
            createdOrder.items
              .map((i) => `${i.id}:${i.name}(x${Number(i.quantity)})`)
              .join(', '),
        );

        const resaleItems = createdOrder.items.filter(
          (item) => item.product.productType === ProductType.RESALE,
        );

        for (const item of resaleItems) {
          await this.stockService.decrement(tx, item.productId, item.quantity);
        }

        const producedItems = createdOrder.items.filter((item) =>
          this.productionService.isProduced(item.product.productType),
        );

        for (const item of producedItems) {
          await this.productionService.create(tx, {
            orderItemId: item.id,
            productionLocation: item.product.productionLocation,
            quantityRequested: item.quantity,
            observation: item.observation,
            pendingAt: resolveLogicalDateTime(),
          });
        }

        if (tableRecord) {
          await this.tableService.occupy(
            tx,
            tableRecord.id,
            createdOrder.id,
            orderData.customerName,
          );
        }

        return createdOrder;
      });

      // Impressão só é despachada depois que a transação inteira foi
      // commitada com sucesso.
      const producedItems = order.items.filter((item) =>
        this.productionService.isProduced(item.product.productType),
      );
      const resaleItems = order.items.filter(
        (item) => item.product.productType === ProductType.RESALE,
      );

      const printBuilder = this.printService.createBuilder({
        orderId: order.id,
        table: order.table,
        customerName: order.customerName,
        operatorName: order.operator?.username,
      });

      for (const item of producedItems) {
        printBuilder.addItem(item.product.productionLocation ?? 'LOCAL_01', {
          name: item.name,
          quantity: Number(item.quantity),
          observation: item.observation,
        });
      }

      for (const item of resaleItems) {
        printBuilder.addItemIfLocation(item.product.productionLocation, {
          name: item.name,
          quantity: Number(item.quantity),
          observation: item.observation,
        });
      }

      this.logger.log(
        `[Pedido ${order.id}] operador=${operatorId} | despachando impressão para ${printBuilder.map.size} local(is): ` +
          [...printBuilder.map.entries()]
            .map(
              ([loc, job]) =>
                `${loc}[${job.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}]`,
            )
            .join(' | '),
      );

      this.printService.dispatchAsync(order.id, printBuilder.map);

      this.logger.log(
        `[Pedido ${order.id}] operador=${operatorId} | criado em ${Date.now() - start}ms`,
      );

      return mapOrderToEntity(order);
    } catch (error: unknown) {
      if ((error as any).code === 'P2003') {
        this.logger.error(
          `[Pedido novo] operador=${operatorId} | erro de chave estrangeira: ${(error as any).message}`,
        );
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
      type,
      searchTable,
      searchName,
      searchWaiterOpen,
      searchWaiterClose,
      startDate,
      endDate,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(searchTable && { table: { contains: searchTable } }),
      ...(searchName && { customerName: { contains: searchName } }),
      ...(searchWaiterOpen && {
        operator: { username: { contains: searchWaiterOpen } },
      }),
      ...(searchWaiterClose && {
        closedByOperator: { username: { contains: searchWaiterClose } },
      }),
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
        include: ORDER_INCLUDE_BASIC,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => mapOrderToEntity(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_BASIC,
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    return mapOrderToEntity(order);
  }

  /**
   * Só campos do pedido (status, customerName, table, serviceCharge,
   * fechamento). Itens são tratados em OrderItemsService (addItems/removeItems).
   */
  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    userRole: string,
    operatorId: number,
  ): Promise<OrderEntity> {
    const start = Date.now();
    const tag = `Pedido ${id}`;

    this.logger.log(
      `[${tag}] operador=${operatorId} role=${userRole} | atualizando campos do pedido`,
    );

    const existingOrder = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
      },
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
      const { status } = updateOrderDto;
      if (!status || status === OrderStatus.CANCELED) {
        throw new BadRequestException(
          'Pedido cancelado só permite atualizar o status',
        );
      }

      const updatedOrder = await this.prisma.client.order.update({
        where: { id },
        data: { status },
        include: ORDER_INCLUDE_BASIC,
      });

      this.logger.log(
        `[${tag}] operador=${operatorId} | status alterado: cancelado -> ${status} | ${Date.now() - start}ms`,
      );

      return mapOrderToEntity(updatedOrder);
    }

    const { serviceCharge, ...orderData } = updateOrderDto;
    const isClosing = orderData.status === OrderStatus.CLOSED;

    const closingData = isClosing
      ? {
          finishedAt: resolveLogicalDateTime(),
          ...(!existingOrder.closedByOperatorId && {
            closedByOperatorId: operatorId,
          }),
        }
      : {};

    const serviceChargeData =
      serviceCharge !== undefined ? { serviceCharge } : {};

    await this.prisma.client.$transaction(async (tx) => {
      const table = await this.tableService.findByOrderId(tx, id);

      // Removido: `total: Number(existingOrder.total)` — era um no-op,
      // já que este método não altera itens (ver OrderItemsService).
      await tx.order.update({
        where: { id },
        data: {
          ...orderData,
          ...closingData,
          ...serviceChargeData,
        },
      });

      if (isClosing && table) {
        await this.tableService.release(tx, table.id);
      }
    });

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE_BASIC,
    });

    this.logger.log(
      `[${tag}] operador=${operatorId} | atualizado em ${Date.now() - start}ms`,
    );

    return mapOrderToEntity(updated!);
  }

  async reprint(
    id: number,
    dto: ReprintOrderDto,
    operatorId: number,
  ): Promise<void> {
    const start = Date.now();
    const tag = `Pedido ${id}`;

    this.logger.log(
      `[${tag}] operador=${operatorId} | reimprimindo | itens: ` +
        JSON.stringify(
          dto.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        ),
    );

    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: { operator: { select: { username: true } } },
    });

    const currentOperator = await this.prisma.client.user.findUnique({
      where: { id: operatorId },
      select: { username: true },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productionLocation: true, productType: true },
    });

    const printBuilder = this.printService.createBuilder({
      orderId: order.id,
      table: order.table,
      customerName: order.customerName,
      operatorName: currentOperator?.username,
      isReprint: true,
    });

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const loc = product.productionLocation?.trim();
      const isProduced = this.productionService.isProduced(product.productType);
      const isResaleWithLocation =
        product.productType === ProductType.RESALE && loc;

      if (isProduced) {
        printBuilder.addItem(loc ?? 'LOCAL_01', {
          name: item.name,
          quantity: item.quantity,
          observation: item.observation,
        });
      } else if (isResaleWithLocation) {
        printBuilder.addItem(loc, {
          name: item.name,
          quantity: item.quantity,
          observation: item.observation,
        });
      }
    }

    if (printBuilder.map.size === 0) {
      this.logger.warn(
        `[${tag}] operador=${operatorId} | nenhum item imprimível para reimpressão`,
      );
      throw new BadRequestException('Nenhum item imprimível');
    }

    await this.printService.dispatchSync(id, printBuilder.map);

    this.logger.log(
      `[${tag}] operador=${operatorId} | reimpresso em ${Date.now() - start}ms`,
    );
  }
}
