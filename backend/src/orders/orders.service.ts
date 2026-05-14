import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { OrderStatus, ProductType, Prisma } from 'generated/prisma/client';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrinterService } from 'src/printer/printer.service';
import { PrintJob, PrintItem } from 'src/printer/dto/print-job.dto';
import { resolveLogicalDateTime } from '../common/date-utils';
import { ReprintOrderDto } from './dto/reprint-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
  ) {}

  private isProduced(type: ProductType): boolean {
    return (
      type === ProductType.MANUFACTURED ||
      type === ProductType.SEMI_MANUFACTURED
    );
  }

  async create(
    createOrderDto: CreateOrderDto,
    operatorId: number,
  ): Promise<OrderEntity> {
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

    try {
      const order = await this.prisma.client.order.create({
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
              serviceCharge: item.serviceCharge ?? 0, // adicionar
              operatorId,
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
          closedByOperator: {
            select: { id: true, username: true, role: true },
          },
        },
      });

      const resaleItems = order.items.filter(
        (item) => item.product.productType === ProductType.RESALE,
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

      const producedItems = order.items.filter((item) =>
        this.isProduced(item.product.productType),
      );

      if (producedItems.length > 0) {
        await this.prisma.client.$transaction(async (tx) => {
          for (const item of producedItems) {
            await tx.orderProduction.create({
              data: {
                orderItemId: item.id,
                productionLocation:
                  item.product.productionLocation || 'LOCAL_01',
                status: 'PENDING',
                quantityRequested: item.quantity,
                quantityProduced: 0,
                pendingAt: resolveLogicalDateTime(),
                observation: item.observation ?? null,
              },
            });
          }
        });
      }

      const printJobsMap = new Map<string, PrintJob>();

      const addToPrintJob = (location: string, item: PrintItem) => {
        if (!printJobsMap.has(location)) {
          printJobsMap.set(location, {
            orderId: order.id,
            table: order.table,
            customerName: order.customerName,
            location,
            operatorName: order.operator?.username,
            items: [],
          });
        }
        printJobsMap.get(location)!.items.push(item);
      };

      for (const item of producedItems) {
        const loc = item.product.productionLocation ?? 'LOCAL_01';
        addToPrintJob(loc, {
          name: item.name,
          quantity: Number(item.quantity),
          observation: item.observation,
        });
      }

      for (const item of resaleItems) {
        const loc = item.product.productionLocation?.trim();
        if (loc) {
          addToPrintJob(loc, {
            name: item.name,
            quantity: Number(item.quantity),
            observation: item.observation,
          });
        }
      }

      if (printJobsMap.size > 0) {
        this.printerService
          .printOrder([...printJobsMap.values()])
          .catch((err) => console.error('Erro ao imprimir:', err));
      }

      if (orderData.table) {
        const tableNumber = parseInt(
          orderData.table.replace('Mesa ', '').trim(),
          10,
        );

        if (!isNaN(tableNumber)) {
          const location =
            await this.prisma.client.productionLocation.findFirst({
              where: { code: orderData.locationId },
            });

          if (location) {
            const tableRecord = await this.prisma.client.table.findUnique({
              where: {
                number_locationId: {
                  number: tableNumber,
                  locationId: location.id,
                },
              },
            });

            if (tableRecord) {
              if (tableRecord.status === 'OCCUPIED') {
                throw new BadRequestException(
                  `Mesa ${tableNumber} já está ocupada`,
                );
              }

              await this.prisma.client.table.update({
                where: { id: tableRecord.id },
                data: {
                  status: 'OCCUPIED',
                  orderId: order.id,
                  customer: orderData.customerName ?? null,
                  time: null,
                },
              });
            }
          }
        }
      }

      return this.mapToEntity(order);
    } catch (error: unknown) {
      if ((error as any).code === 'P2003') {
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
        include: {
          items: true,
          operator: { select: { id: true, username: true, role: true } },
          closedByOperator: {
            select: { id: true, username: true, role: true },
          },
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
        closedByOperator: { select: { id: true, username: true, role: true } },
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
    operatorId: number,
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
        closedByOperator: { select: { id: true, username: true, role: true } },
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
          closedByOperator: {
            select: { id: true, username: true, role: true },
          },
        },
      });

      return this.mapToEntity(updatedOrder);
    }

    const { items, serviceCharge, ...orderData } = updateOrderDto;
    const isClosing = orderData.status === OrderStatus.CLOSED;
    const isInProduction = existingOrder.items.some((item) =>
      item.productions.some((p) => p.status === 'IN_PROGRESS'),
    );

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

    const printJobsMap = new Map<string, PrintJob>();

    const addToPrintJob = (location: string, item: PrintItem) => {
      if (!printJobsMap.has(location)) {
        printJobsMap.set(location, {
          orderId: id,
          table: existingOrder.table,
          customerName: existingOrder.customerName,
          operatorName: existingOrder.operator?.username,
          location,
          items: [],
        });
      }
      printJobsMap.get(location)!.items.push(item);
    };

    const addToPrintIfHasLocation = (
      productionLocation: string | null | undefined,
      item: PrintItem,
    ) => {
      const loc = productionLocation?.trim();
      if (loc) addToPrintJob(loc, item);
    };

    await this.prisma.client.$transaction(async (tx) => {
      const table = await tx.table.findUnique({ where: { orderId: id } });

      if (!items) {
        await tx.order.update({
          where: { id },
          data: {
            ...orderData,
            total: Number(existingOrder.total),
            ...closingData,
            ...serviceChargeData,
          },
        });
      } else {
        let totalPedido = 0;

        // --- Remoção de itens ---
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

        for (const item of removedItems) {
          if (this.isProduced(item.product.productType)) {
            await tx.orderProduction.updateMany({
              where: {
                orderItemId: item.id,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
              },
              data: { status: 'CANCELED' },
            });
          }

          await tx.orderItem.delete({ where: { id: item.id } });

          if (item.product.productType === ProductType.RESALE) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }

        // --- Atualização de itens existentes ---
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

          const diferenca = novaQuantidade - quantidadeAtual;

          if (diferenca > 0) {
            if (this.isProduced(existing.product.productType)) {
              await tx.orderProduction.create({
                data: {
                  orderItemId: existing.id,
                  productionLocation:
                    existing.product.productionLocation || 'LOCAL_01',
                  status: 'PENDING',
                  quantityRequested: diferenca,
                  quantityProduced: 0,
                  pendingAt: resolveLogicalDateTime(),
                  observation:
                    incoming.observation ?? existing.observation ?? null,
                },
              });
              addToPrintJob(existing.product.productionLocation || 'LOCAL_01', {
                name: existing.name,
                quantity: diferenca,
                observation: incoming.observation ?? existing.observation,
              });
            }
            if (existing.product.productType === ProductType.RESALE) {
              await tx.product.update({
                where: { id: existing.productId },
                data: { quantity: { decrement: diferenca } },
              });
              addToPrintIfHasLocation(existing.product.productionLocation, {
                name: existing.name,
                quantity: diferenca,
                observation: incoming.observation ?? existing.observation,
              });
            }
          }

          if (diferenca < 0) {
            if (this.isProduced(existing.product.productType)) {
              let restanteParaCancelar = Math.abs(diferenca);

              for (const prod of existing.productions.filter(
                (p) => p.status === 'PENDING',
              )) {
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
            }

            if (existing.product.productType === ProductType.RESALE) {
              await tx.product.update({
                where: { id: existing.productId },
                data: { quantity: { increment: Math.abs(diferenca) } },
              });
            }
          }

          const precoFinal = novoPreco !== precoAtual ? novoPreco : precoAtual;
          const totalItem = novaQuantidade * precoFinal;
          totalPedido += totalItem;

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

        // --- Novos itens ---
        const newItems = items.filter((i) => !i.id);

        if (newItems.length > 0) {
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
                serviceCharge: newItem.serviceCharge ?? 0, // adicionar
                operatorId,
                observation: newItem.observation ?? null,
              },
            });

            if (product.productType === ProductType.RESALE) {
              await tx.product.update({
                where: { id: newItem.productId },
                data: { quantity: { decrement: newItem.quantity } },
              });

              addToPrintIfHasLocation(product.productionLocation, {
                name: newItem.name!,
                quantity: newItem.quantity,
                observation: newItem.observation,
              });
            }

            if (this.isProduced(product.productType)) {
              await tx.orderProduction.create({
                data: {
                  orderItemId: createdItem.id,
                  productionLocation: product.productionLocation || 'LOCAL_01',
                  status: 'PENDING',
                  quantityRequested: createdItem.quantity,
                  quantityProduced: 0,
                  pendingAt: resolveLogicalDateTime(),
                  observation: newItem.observation ?? null,
                },
              });

              addToPrintJob(product.productionLocation || 'LOCAL_01', {
                name: newItem.name!,
                quantity: newItem.quantity,
                observation: newItem.observation,
              });
            }
          }
        }

        await tx.order.update({
          where: { id },
          data: {
            ...orderData,
            total: totalPedido,
            ...closingData,
            ...serviceChargeData,
          },
        });
      }

      // --- Liberar mesa (sempre executado se isClosing) ---
      if (isClosing && table) {
        await tx.table.update({
          where: { id: table.id },
          data: {
            status: 'AVAILABLE',
            customer: null,
            time: null,
            orderId: null,
          },
        });
      }
    });

    if (printJobsMap.size > 0) {
      this.printerService
        .printOrder([...printJobsMap.values()])
        .catch((err) => console.error('Erro ao imprimir:', err));
    }

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
      },
    });

    return this.mapToEntity(updated!);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.order.delete({ where: { id } });
  }

  async cancel(id: number): Promise<OrderEntity> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: { include: { productions: true, product: true } },
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
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
        closedByOperator: { select: { id: true, username: true, role: true } },
      },
    });

    return this.mapToEntity(canceledOrder!);
  }

  async reopen(id: number): Promise<OrderEntity> {
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
      throw new BadRequestException('Pedido pago não pode ser reaberto');
    }

    let tableRecord: { id: number; status: string } | null = null;

    if (order.table) {
      const tableNumber = parseInt(order.table.replace('Mesa ', '').trim(), 10);

      if (!isNaN(tableNumber)) {
        const location = await this.prisma.client.productionLocation.findFirst({
          where: { code: order.locationId },
        });

        if (location) {
          tableRecord = await this.prisma.client.table.findUnique({
            where: {
              number_locationId: {
                number: tableNumber,
                locationId: location.id,
              },
            },
          });

          if (tableRecord?.status === 'OCCUPIED') {
            throw new BadRequestException(
              `Mesa ${tableNumber} já está ocupada por outro cliente`,
            );
          }
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
        await tx.table.update({
          where: { id: tableRecord.id },
          data: {
            status: 'OCCUPIED',
            orderId: id,
            customer: order.customerName ?? null,
            time: null,
          },
        });
      }
    });

    const updated = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        items: true,
        operator: { select: { id: true, username: true, role: true } },
        closedByOperator: { select: { id: true, username: true, role: true } },
      },
    });

    return this.mapToEntity(updated!);
  }

  async reprint(id: number, dto: ReprintOrderDto): Promise<void> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: {
        operator: { select: { username: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, productionLocation: true, productType: true },
    });

    const printJobsMap = new Map<string, PrintJob>();

    const addToPrintJob = (location: string, item: PrintItem) => {
      if (!printJobsMap.has(location)) {
        printJobsMap.set(location, {
          orderId: order.id,
          table: order.table,
          customerName: order.customerName,
          location,
          isReprint: true,
          operatorName: order.operator?.username,
          items: [],
        });
      }
      printJobsMap.get(location)!.items.push(item);
    };

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const loc = product.productionLocation?.trim();
      const isProduced = this.isProduced(product.productType);
      const isResaleWithLocation =
        product.productType === ProductType.RESALE && loc;

      if (isProduced) {
        addToPrintJob(loc ?? 'LOCAL_01', {
          name: item.name,
          quantity: item.quantity,
          observation: item.observation,
        });
      } else if (isResaleWithLocation) {
        addToPrintJob(loc, {
          name: item.name,
          quantity: item.quantity,
          observation: item.observation,
        });
      }
    }

    if (printJobsMap.size === 0) {
      throw new BadRequestException('Nenhum item imprimível');
    }

    await this.printerService.printOrder([...printJobsMap.values()]);
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
      serviceCharge: Number(order.serviceCharge ?? 0),
      waiterOpen: order.operator ?? null,
      waiterClose: order.closedByOperator ?? null,
      operator: order.operator ?? null,
      closedByOperator: order.closedByOperator ?? null,
      items:
        order.items?.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          serviceCharge: Number(item.serviceCharge ?? 0), // adicionar
          operatorId: item.operatorId ?? null,
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
