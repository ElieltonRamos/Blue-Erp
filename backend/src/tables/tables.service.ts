/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/tables/tables.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import { OccupyTableDto } from './dto/occupy-table.dto.js';
import { ReserveTableDto } from './dto/reserve-table.dto.js';
import {
  CloseTabResponseDto,
  TableResponseDto,
} from './dto/response-table.dto.js';
import { CloseTabDto } from './dto/close-tab.dto.js';
import { TableStatus, OrderStatus } from 'generated/prisma/client';
import { resolveLogicalDateTime } from '../common/date-utils.js';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTableDto): Promise<TableResponseDto> {
    const location = await this.prisma.client.productionLocation.findUnique({
      where: { id: dto.locationId },
    });

    if (!location) {
      this.logger.error(
        `Criação de mesa falhou: localização ${dto.locationId} não encontrada`,
      );
      throw new NotFoundException('Localização não encontrada');
    }

    const existing = await this.prisma.client.table.findUnique({
      where: {
        number_locationId: {
          number: dto.number,
          locationId: dto.locationId,
        },
      },
    });

    if (existing) {
      this.logger.error(
        `Criação de mesa falhou: mesa ${dto.number} já existe na localização ${dto.locationId}`,
      );
      throw new ConflictException(
        `Já existe mesa ${dto.number} nesta localização`,
      );
    }

    const table = await this.prisma.client.table.create({
      data: {
        number: dto.number,
        capacity: dto.capacity,
        locationId: dto.locationId,
      },
      include: { location: true },
    });

    this.logger.log(
      `Mesa ${table.number} criada na localização ${dto.locationId} (id ${table.id})`,
    );

    return new TableResponseDto(table);
  }

  async findAll(locationId?: number): Promise<TableResponseDto[]> {
    const where = locationId ? { locationId } : {};

    const tables = await this.prisma.client.table.findMany({
      where,
      include: {
        location: true,
        order: {
          include: {
            items: {
              include: { productions: true },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    return tables.map((t) => new TableResponseDto(t));
  }

  async findOne(id: number): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({
      where: { id },
      include: {
        location: true,
        order: {
          include: {
            items: {
              include: { productions: true },
            },
          },
        },
      },
    });

    if (!table) {
      this.logger.error(`Mesa ${id} não encontrada`);
      throw new NotFoundException('Mesa não encontrada');
    }

    return new TableResponseDto(table);
  }

  async update(id: number, dto: UpdateTableDto): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!table) {
      this.logger.error(
        `Atualização de mesa falhou: mesa ${id} não encontrada`,
      );
      throw new NotFoundException('Mesa não encontrada');
    }

    if (dto.locationId && dto.locationId !== table.locationId) {
      const location = await this.prisma.client.productionLocation.findUnique({
        where: { id: dto.locationId },
      });

      if (!location) {
        this.logger.error(
          `Atualização de mesa ${id} falhou: localização ${dto.locationId} não encontrada`,
        );
        throw new NotFoundException('Localização não encontrada');
      }

      const numberToCheck = dto.number ?? table.number;
      const existing = await this.prisma.client.table.findUnique({
        where: {
          number_locationId: {
            number: numberToCheck,
            locationId: dto.locationId,
          },
        },
      });

      if (existing) {
        this.logger.error(
          `Atualização de mesa ${id} falhou: mesa ${numberToCheck} já existe na localização ${dto.locationId}`,
        );
        throw new ConflictException(
          `Já existe mesa ${numberToCheck} nesta localização`,
        );
      }
    }

    if (dto.number && dto.number !== table.number) {
      const locationToCheck = dto.locationId ?? table.locationId;
      const existing = await this.prisma.client.table.findUnique({
        where: {
          number_locationId: {
            number: dto.number,
            locationId: locationToCheck,
          },
        },
      });

      if (existing) {
        this.logger.error(
          `Atualização de mesa ${id} falhou: mesa ${dto.number} já existe na localização ${locationToCheck}`,
        );
        throw new ConflictException(
          `Já existe mesa ${dto.number} nesta localização`,
        );
      }
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const updatedTable = await tx.table.update({
        where: { id },
        data: dto,
        include: { location: true },
      });

      if (table.orderId && (dto.locationId || dto.customer || dto.number)) {
        const orderUpdate: any = {};

        if (dto.locationId) {
          const newLocation = await tx.productionLocation.findUnique({
            where: { id: dto.locationId },
          });
          orderUpdate.locationId = newLocation!.code;
        }

        if (dto.customer) {
          orderUpdate.customerName = dto.customer;
        }

        if (dto.number) {
          orderUpdate.table = `Mesa ${dto.number}`;
        }

        if (Object.keys(orderUpdate).length > 0) {
          await tx.order.update({
            where: { id: table.orderId },
            data: orderUpdate,
          });
        }
      }

      return updatedTable;
    });

    this.logger.log(`Mesa ${id} atualizada: ${Object.keys(dto).join(', ')}`);

    return new TableResponseDto(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const table = await this.prisma.client.table.findUnique({ where: { id } });

    if (!table) {
      this.logger.error(`Exclusão de mesa falhou: mesa ${id} não encontrada`);
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status !== 'AVAILABLE') {
      this.logger.warn(
        `Exclusão de mesa ${id} bloqueada: status atual é ${table.status}`,
      );
      throw new BadRequestException('Só é possível excluir mesas disponíveis');
    }

    await this.prisma.client.table.delete({ where: { id } });

    this.logger.log(`Mesa ${id} excluída`);

    return { message: 'Mesa excluída com sucesso' };
  }

  async occupy(
    id: number,
    dto: OccupyTableDto,
    operatorId: number,
  ): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({
      where: { id },
      include: { location: true },
    });

    if (!table) {
      this.logger.error(`Ocupação de mesa falhou: mesa ${id} não encontrada`);
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'OCCUPIED') {
      this.logger.warn(`Ocupação de mesa ${id} bloqueada: mesa já ocupada`);
      throw new BadRequestException('Mesa já está ocupada');
    }

    return this.prisma.client.$transaction(
      async (tx): Promise<TableResponseDto> => {
        const order = await tx.order.create({
          data: {
            type: 'DINE_IN',
            locationId: table.location.code,
            customerName: dto.customer,
            table: `Mesa ${table.number}`,
            status: 'OPEN',
            total: 0,
            operatorId,
            createdAt: resolveLogicalDateTime(),
            items: { create: [] },
          },
        });

        const result = await tx.table.update({
          where: { id },
          data: {
            status: 'OCCUPIED',
            customer: dto.customer,
            time: null,
            orderId: order.id,
          },
          include: {
            location: true,
            order: { include: { items: true } },
          },
        });

        this.logger.log(
          `Mesa ${id} ocupada por ${dto.customer} (comanda #${order.id})`,
        );

        return new TableResponseDto(result);
      },
    );
  }

  async release(id: number): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!table) {
      this.logger.error(`Liberação de mesa falhou: mesa ${id} não encontrada`);
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'AVAILABLE') {
      this.logger.warn(`Liberação de mesa ${id} bloqueada: mesa já disponível`);
      throw new BadRequestException('Mesa já está disponível');
    }

    if (table.order?.items && table.order.items.length > 0) {
      this.logger.warn(
        `Liberação de mesa ${id} bloqueada: comanda #${table.orderId} possui itens pendentes`,
      );
      throw new BadRequestException(
        'Finalize a comanda antes de liberar a mesa',
      );
    }

    return this.prisma.client.$transaction(
      async (tx): Promise<TableResponseDto> => {
        if (table.orderId) {
          await tx.order.update({
            where: { id: table.orderId },
            data: { status: 'CANCELED' },
          });
        }

        const result = await tx.table.update({
          where: { id },
          data: {
            status: 'AVAILABLE',
            customer: null,
            time: null,
            orderId: null,
          },
          include: { location: true },
        });

        this.logger.log(`Mesa ${id} liberada`);

        return new TableResponseDto(result);
      },
    );
  }

  async reserve(id: number, dto: ReserveTableDto): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({ where: { id } });

    if (!table) {
      this.logger.error(`Reserva de mesa falhou: mesa ${id} não encontrada`);
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'OCCUPIED') {
      this.logger.warn(`Reserva de mesa ${id} bloqueada: mesa está ocupada`);
      throw new BadRequestException('Mesa está ocupada');
    }

    const updated = await this.prisma.client.table.update({
      where: { id },
      data: { status: 'RESERVED', customer: dto.customer, time: dto.time },
      include: { location: true },
    });

    this.logger.log(`Mesa ${id} reservada para ${dto.customer} às ${dto.time}`);

    return new TableResponseDto(updated);
  }

  async closeTab(
    id: number,
    operatorId: number,
    dto: CloseTabDto,
  ): Promise<CloseTabResponseDto> {
    const table = await this.prisma.client.table.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!table) {
      this.logger.error(
        `Fechamento de comanda falhou: mesa ${id} não encontrada`,
      );
      throw new NotFoundException('Mesa não encontrada');
    }
    if (!table.order || table.status !== 'OCCUPIED') {
      this.logger.warn(
        `Fechamento de comanda bloqueado: mesa ${id} não possui comanda ativa`,
      );
      throw new BadRequestException('Mesa não possui comanda ativa');
    }
    if (!table.order.items || table.order.items.length === 0) {
      this.logger.warn(
        `Fechamento de comanda bloqueado: comanda #${table.orderId} sem produtos`,
      );
      throw new BadRequestException('Não há produtos na comanda');
    }

    const now = resolveLogicalDateTime();

    const result = await this.prisma.client.$transaction(async (tx) => {
      // Atualiza serviceCharge por item se fornecido
      if (dto.items && dto.items.length > 0) {
        for (const itemDto of dto.items) {
          await tx.orderItem.update({
            where: { id: itemDto.id },
            data: { serviceCharge: itemDto.serviceCharge },
          });
        }
      }

      const closedOrder = await tx.order.update({
        where: { id: table.orderId! },
        data: {
          status: 'CLOSED',
          finishedAt: now,
          tableOccupiedUntil: now,
          serviceCharge: dto.serviceCharge ?? 0,
          ...(!table.order!.closedByOperatorId && {
            closedByOperatorId: operatorId,
          }),
        },
      });

      await tx.table.update({
        where: { id },
        data: {
          status: 'AVAILABLE',
          customer: null,
          time: null,
          orderId: null,
        },
      });

      return {
        orderId: closedOrder.id,
        total: Number(closedOrder.total),
        serviceCharge: Number(closedOrder.serviceCharge),
        message: `Comanda fechada para a mesa ${table.number}`,
      };
    });

    this.logger.log(
      `Comanda #${result.orderId} fechada (mesa ${table.number}, total ${result.total})`,
    );

    return new CloseTabResponseDto(result);
  }

  async transferTable(
    originOrderId: number,
    targetTableNumber: number,
    targetLocationCode: string,
  ): Promise<{ message: string }> {
    const startedAt = Date.now();
    this.logger.log(
      `Transferência iniciada: comanda #${originOrderId} -> mesa ${targetTableNumber} (${targetLocationCode})`,
    );

    const originOrder = await this.prisma.client.order.findUnique({
      where: { id: originOrderId },
      include: { items: { include: { productions: true } } },
    });

    if (!originOrder) {
      this.logger.error(
        `Transferência falhou: comanda #${originOrderId} não encontrada`,
      );
      throw new NotFoundException(`Pedido ${originOrderId} não encontrado`);
    }
    if (originOrder.status !== OrderStatus.OPEN) {
      this.logger.warn(
        `Transferência bloqueada: comanda #${originOrderId} não está aberta (status ${originOrder.status})`,
      );
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser transferidos',
      );
    }
    if (!originOrder.table) {
      this.logger.warn(
        `Transferência bloqueada: comanda #${originOrderId} não está associada a uma mesa`,
      );
      throw new BadRequestException(
        'Este pedido não está associado a uma mesa',
      );
    }

    const originTableNumber = parseInt(
      originOrder.table.replace('Mesa ', '').trim(),
      10,
    );
    if (isNaN(originTableNumber)) {
      this.logger.warn(
        `Transferência bloqueada: número de mesa inválido "${originOrder.table}" na comanda #${originOrderId}`,
      );
      throw new BadRequestException(
        `Número de mesa inválido: ${originOrder.table}`,
      );
    }
    if (
      originTableNumber === targetTableNumber &&
      originOrder.locationId === targetLocationCode
    ) {
      this.logger.warn(
        `Transferência bloqueada: mesa de destino (${targetTableNumber}/${targetLocationCode}) é a mesma que a de origem`,
      );
      throw new BadRequestException(
        'A mesa de destino é a mesma que a de origem',
      );
    }

    const [originLocation, targetLocation] = await Promise.all([
      this.prisma.client.productionLocation.findFirst({
        where: { code: originOrder.locationId },
      }),
      this.prisma.client.productionLocation.findFirst({
        where: { code: targetLocationCode },
      }),
    ]);

    if (!originLocation) {
      this.logger.error(
        `Transferência falhou: local de origem ${originOrder.locationId} não encontrado`,
      );
      throw new NotFoundException(
        `Local de origem ${originOrder.locationId} não encontrado`,
      );
    }
    if (!targetLocation) {
      this.logger.error(
        `Transferência falhou: local de destino ${targetLocationCode} não encontrado`,
      );
      throw new NotFoundException(
        `Local de destino ${targetLocationCode} não encontrado`,
      );
    }

    const [originTableRecord, targetTableRecord] = await Promise.all([
      this.prisma.client.table.findUnique({
        where: {
          number_locationId: {
            number: originTableNumber,
            locationId: originLocation.id,
          },
        },
      }),
      this.prisma.client.table.findUnique({
        where: {
          number_locationId: {
            number: targetTableNumber,
            locationId: targetLocation.id,
          },
        },
      }),
    ]);

    if (!originTableRecord) {
      this.logger.error(
        `Transferência falhou: mesa ${originTableNumber} não encontrada no local ${originOrder.locationId}`,
      );
      throw new NotFoundException(
        `Mesa ${originTableNumber} não encontrada no local ${originOrder.locationId}`,
      );
    }
    if (!targetTableRecord) {
      this.logger.error(
        `Transferência falhou: mesa ${targetTableNumber} não encontrada no local ${targetLocationCode}`,
      );
      throw new NotFoundException(
        `Mesa ${targetTableNumber} não encontrada no local ${targetLocationCode}`,
      );
    }

    const targetOpenOrder = targetTableRecord.orderId
      ? await this.prisma.client.order.findUnique({
          where: { id: targetTableRecord.orderId },
          include: { items: { include: { productions: true } } },
        })
      : null;

    if (targetOpenOrder && targetOpenOrder.status === OrderStatus.OPEN) {
      this.logger.log(
        `Transferência: mesclando comanda #${originOrderId} com comanda #${targetOpenOrder.id} na mesa ${targetTableNumber}`,
      );
      const result = await this.mergeOrders({
        originOrder,
        targetOpenOrder,
        originTableRecord,
        targetTableRecord,
        targetTableNumber,
      });
      this.logger.log(
        `Transferência concluída em ${Date.now() - startedAt}ms (mesclagem)`,
      );
      return result;
    }

    if (targetTableRecord.status === TableStatus.OCCUPIED) {
      this.logger.warn(
        `Transferência bloqueada: mesa ${targetTableNumber} já está ocupada`,
      );
      throw new BadRequestException(
        `Mesa ${targetTableNumber} já está ocupada`,
      );
    }

    this.logger.log(
      `Transferência: movendo comanda #${originOrderId} para mesa ${targetTableNumber} (livre)`,
    );
    const result = await this.moveOrder({
      originOrderId,
      originOrder,
      originTableRecord,
      targetTableRecord,
      targetTableNumber,
      targetLocationCode,
    });
    this.logger.log(
      `Transferência concluída em ${Date.now() - startedAt}ms (movimentação)`,
    );
    return result;
  }

  private async mergeOrders(params: {
    originOrder: any;
    targetOpenOrder: any;
    originTableRecord: any;
    targetTableRecord: any;
    targetTableNumber: number;
  }): Promise<{ message: string }> {
    const {
      originOrder,
      targetOpenOrder,
      originTableRecord,
      targetTableRecord,
      targetTableNumber,
    } = params;

    const targetItemsMap = new Map<number, any>(
      targetOpenOrder.items.map((i: any) => [
        i.productId,
        { ...i, mergedFromId: null },
      ]),
    );

    const newItems: any[] = [];

    for (const originItem of originOrder.items) {
      const existing = targetItemsMap.get(originItem.productId);
      if (existing) {
        const newQty = Number(existing.quantity) + Number(originItem.quantity);
        existing.quantity = newQty;
        existing.total = newQty * Number(existing.unitPrice);
        existing.mergedFromId = originItem.id;
        targetItemsMap.set(originItem.productId, existing);
      } else {
        newItems.push(originItem);
      }
    }

    const updatedTargetItems = Array.from(targetItemsMap.values());
    const allItems = [...updatedTargetItems, ...newItems];

    const newTotal = allItems.reduce((sum, i) => sum + Number(i.total), 0);
    const newServiceCharge = allItems.reduce(
      (sum, i) => sum + Number(i.serviceCharge ?? 0),
      0,
    );

    const originName = originOrder.customerName?.trim() || null;
    const targetName = targetOpenOrder.customerName?.trim() || null;
    const mergedName =
      originName && targetName && originName !== targetName
        ? `${targetName} e ${originName}`
        : targetName || originName || null;

    await this.prisma.client.$transaction(async (tx) => {
      await tx.table.update({
        where: { id: originTableRecord.id },
        data: { status: TableStatus.AVAILABLE, orderId: null, customer: null },
      });

      for (const item of updatedTargetItems) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity, total: item.total },
        });

        if (item.mergedFromId) {
          await tx.orderProduction.updateMany({
            where: { orderItemId: item.mergedFromId },
            data: { orderItemId: item.id },
          });
        }
      }

      const itemIdMap = new Map<number, number>();

      for (const item of newItems) {
        const created = await tx.orderItem.create({
          data: {
            orderId: targetOpenOrder.id,
            productId: item.productId,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            serviceCharge: item.serviceCharge ?? 0,
            operatorId: item.operatorId ?? null,
            unitPrice: item.unitPrice,
            total: Number(item.quantity) * Number(item.unitPrice),
            observation: item.observation ?? null,
          },
        });
        itemIdMap.set(item.id, created.id);
      }

      for (const [oldItemId, newItemId] of itemIdMap) {
        await tx.orderProduction.updateMany({
          where: { orderItemId: oldItemId },
          data: { orderItemId: newItemId },
        });
      }

      await tx.order.update({
        where: { id: targetOpenOrder.id },
        data: {
          total: newTotal,
          customerName: mergedName,
          serviceCharge: newServiceCharge,
        },
      });

      await tx.table.update({
        where: { id: targetTableRecord.id },
        data: {
          customer: mergedName,
          orderId: targetOpenOrder.id,
          status: TableStatus.OCCUPIED,
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId: originOrder.id } });
      await tx.order.delete({ where: { id: originOrder.id } });
    });

    return {
      message: `Comanda #${originOrder.id} (${originOrder.table}) fundida com comanda #${targetOpenOrder.id} (Mesa ${targetTableNumber}). Mesa ${originOrder.table} liberada.`,
    };
  }

  // --- Transferência simples: move pedido para mesa livre ---
  private async moveOrder(params: {
    originOrderId: number;
    originOrder: any;
    originTableRecord: any;
    targetTableRecord: any;
    targetTableNumber: number;
    targetLocationCode: string;
  }): Promise<{ message: string }> {
    const {
      originOrderId,
      originOrder,
      originTableRecord,
      targetTableRecord,
      targetTableNumber,
      targetLocationCode,
    } = params;

    await this.prisma.client.$transaction(async (tx) => {
      // --- Libera mesa origem ---
      await tx.table.update({
        where: { id: originTableRecord.id },
        data: { status: TableStatus.AVAILABLE, orderId: null, customer: null },
      });

      // --- Atualiza pedido com nova mesa e location ---
      await tx.order.update({
        where: { id: originOrderId },
        data: {
          table: `Mesa ${targetTableNumber}`,
          locationId: targetLocationCode,
        },
      });

      // --- Ocupa mesa destino com dados do pedido ---
      await tx.table.update({
        where: { id: targetTableRecord.id },
        data: {
          status: TableStatus.OCCUPIED,
          orderId: originOrderId,
          customer: originOrder.customerName ?? null,
        },
      });
    });

    return {
      message: `Comanda #${originOrder.id} transferida de ${originOrder.table} para Mesa ${targetTableNumber}. Mesa de origem liberada.`,
    };
  }
}
