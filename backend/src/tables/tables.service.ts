/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/tables/tables.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTableDto): Promise<TableResponseDto> {
    const location = await this.prisma.client.productionLocation.findUnique({
      where: { id: dto.locationId },
    });

    if (!location) {
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
      throw new NotFoundException('Mesa não encontrada');
    }

    if (dto.locationId && dto.locationId !== table.locationId) {
      const location = await this.prisma.client.productionLocation.findUnique({
        where: { id: dto.locationId },
      });

      if (!location) {
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

    return new TableResponseDto(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const table = await this.prisma.client.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status !== 'AVAILABLE') {
      throw new BadRequestException('Só é possível excluir mesas disponíveis');
    }

    await this.prisma.client.table.delete({ where: { id } });

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
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'OCCUPIED') {
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
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'AVAILABLE') {
      throw new BadRequestException('Mesa já está disponível');
    }

    if (table.order?.items && table.order.items.length > 0) {
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

        return new TableResponseDto(result);
      },
    );
  }

  async reserve(id: number, dto: ReserveTableDto): Promise<TableResponseDto> {
    const table = await this.prisma.client.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status === 'OCCUPIED') {
      throw new BadRequestException('Mesa está ocupada');
    }

    const updated = await this.prisma.client.table.update({
      where: { id },
      data: { status: 'RESERVED', customer: dto.customer, time: dto.time },
      include: { location: true },
    });

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

    if (!table) throw new NotFoundException('Mesa não encontrada');
    if (!table.order || table.status !== 'OCCUPIED')
      throw new BadRequestException('Mesa não possui comanda ativa');
    if (!table.order.items || table.order.items.length === 0)
      throw new BadRequestException('Não há produtos na comanda');

    const now = resolveLogicalDateTime();

    const result = await this.prisma.client.$transaction(async (tx) => {
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

    return new CloseTabResponseDto(result);
  }

  async transferTable(
    originOrderId: number,
    targetTableNumber: number,
    targetLocationCode: string,
  ): Promise<{ message: string }> {
    // --- Busca e valida pedido origem ---
    const originOrder = await this.prisma.client.order.findUnique({
      where: { id: originOrderId },
      include: { items: { include: { productions: true } } },
    });

    if (!originOrder) {
      throw new NotFoundException(`Pedido ${originOrderId} não encontrado`);
    }
    if (originOrder.status !== OrderStatus.OPEN) {
      throw new BadRequestException(
        'Apenas pedidos abertos podem ser transferidos',
      );
    }
    if (!originOrder.table) {
      throw new BadRequestException(
        'Este pedido não está associado a uma mesa',
      );
    }

    const originTableNumber = parseInt(
      originOrder.table.replace('Mesa ', '').trim(),
      10,
    );
    if (isNaN(originTableNumber)) {
      throw new BadRequestException(
        `Número de mesa inválido: ${originOrder.table}`,
      );
    }
    if (
      originTableNumber === targetTableNumber &&
      originOrder.locationId === targetLocationCode
    ) {
      throw new BadRequestException(
        'A mesa de destino é a mesma que a de origem',
      );
    }

    // --- Busca locations de origem e destino ---
    const [originLocation, targetLocation] = await Promise.all([
      this.prisma.client.productionLocation.findFirst({
        where: { code: originOrder.locationId },
      }),
      this.prisma.client.productionLocation.findFirst({
        where: { code: targetLocationCode },
      }),
    ]);

    if (!originLocation) {
      throw new NotFoundException(
        `Local de origem ${originOrder.locationId} não encontrado`,
      );
    }
    if (!targetLocation) {
      throw new NotFoundException(
        `Local de destino ${targetLocationCode} não encontrado`,
      );
    }

    // --- Busca registros físicos das mesas ---
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
      throw new NotFoundException(
        `Mesa ${originTableNumber} não encontrada no local ${originOrder.locationId}`,
      );
    }
    if (!targetTableRecord) {
      throw new NotFoundException(
        `Mesa ${targetTableNumber} não encontrada no local ${targetLocationCode}`,
      );
    }

    // --- Verifica se mesa destino já tem pedido aberto (merge) ou está livre (transferência simples) ---
    const targetOpenOrder = await this.prisma.client.order.findFirst({
      where: {
        table: `Mesa ${targetTableNumber}`,
        locationId: targetLocationCode,
        status: OrderStatus.OPEN,
      },
      include: { items: { include: { productions: true } } },
    });

    if (targetOpenOrder) {
      return this.mergeOrders({
        originOrder,
        targetOpenOrder,
        originTableRecord,
        targetTableNumber,
      });
    }

    if (targetTableRecord.status === TableStatus.OCCUPIED) {
      throw new BadRequestException(
        `Mesa ${targetTableNumber} já está ocupada`,
      );
    }

    return this.moveOrder({
      originOrderId,
      originOrder,
      originTableRecord,
      targetTableRecord,
      targetTableNumber,
      targetLocationCode,
    });
  }

  // --- Merge: funde pedido origem no pedido já aberto da mesa destino ---
  private async mergeOrders(params: {
    originOrder: any;
    targetOpenOrder: any;
    originTableRecord: any;
    targetTableNumber: number;
  }): Promise<{ message: string }> {
    const {
      originOrder,
      targetOpenOrder,
      originTableRecord,
      targetTableNumber,
    } = params;

    // --- Monta mapa de itens do destino indexado por productId ---
    // Inclui mergedFromId para rastrear de qual item da origem veio o merge
    const targetItemsMap = new Map<number, any>(
      targetOpenOrder.items.map((i: any) => [
        i.productId,
        { ...i, mergedFromId: null },
      ]),
    );

    // --- Separa itens da origem: merged (produto já existe no destino) vs novos ---
    const newItems: any[] = [];

    for (const originItem of originOrder.items) {
      const existing = targetItemsMap.get(originItem.productId);
      if (existing) {
        // Produto já existe no destino: soma quantidades e registra origem para reatribuir productions
        const newQty = Number(existing.quantity) + Number(originItem.quantity);
        existing.quantity = newQty;
        existing.total = newQty * Number(existing.unitPrice);
        existing.mergedFromId = originItem.id;
        targetItemsMap.set(originItem.productId, existing);
      } else {
        // Produto novo no destino: será criado e terá productions reatribuídas
        newItems.push(originItem);
      }
    }

    const updatedTargetItems = Array.from(targetItemsMap.values());
    const allItems = [...updatedTargetItems, ...newItems];

    // --- Calcula novo total e serviceCharge proporcional ---
    const newTotal = allItems.reduce((sum, i) => sum + Number(i.total), 0);
    const newServiceCharge = allItems.reduce(
      (sum, i) => sum + Number(i.serviceCharge ?? 0),
      0,
    );

    // --- Mescla nome do cliente ---
    const originName = originOrder.customerName?.trim() || null;
    const targetName = targetOpenOrder.customerName?.trim() || null;
    const mergedName =
      originName && targetName && originName !== targetName
        ? `${targetName} e ${originName}`
        : targetName || originName || null;

    await this.prisma.client.$transaction(async (tx) => {
      // --- Libera mesa origem ---
      await tx.table.update({
        where: { id: originTableRecord.id },
        data: { status: TableStatus.AVAILABLE, orderId: null, customer: null },
      });

      // --- Atualiza itens existentes no destino e reatribui productions mergeadas ---
      for (const item of updatedTargetItems) {
        await tx.orderItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity, total: item.total },
        });

        // Se o item teve quantidade mergeada, reatribui as productions do item origem
        // para o item destino, preservando o estado de produção na cozinha
        if (item.mergedFromId) {
          await tx.orderProduction.updateMany({
            where: { orderItemId: item.mergedFromId },
            data: { orderItemId: item.id },
          });
        }
      }

      // --- Cria itens novos no destino e mapeia oldItemId → newItemId ---
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

      // --- Reatribui productions dos itens novos para os recém-criados no destino ---
      for (const [oldItemId, newItemId] of itemIdMap) {
        await tx.orderProduction.updateMany({
          where: { orderItemId: oldItemId },
          data: { orderItemId: newItemId },
        });
      }

      // --- Atualiza total, serviceCharge e nome do cliente no pedido destino ---
      await tx.order.update({
        where: { id: targetOpenOrder.id },
        data: {
          total: newTotal,
          customerName: mergedName,
          serviceCharge: newServiceCharge,
        },
      });

      // --- Sincroniza nome do cliente na mesa destino ---
      await tx.table.update({
        where: { orderId: targetOpenOrder.id },
        data: { customer: mergedName },
      });

      // --- Deleta itens da origem (productions já foram todas reatribuídas, cascade não remove nada ativo) ---
      await tx.orderItem.deleteMany({ where: { orderId: originOrder.id } });

      // --- Deleta pedido origem ---
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
