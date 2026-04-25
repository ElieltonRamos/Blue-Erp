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

    const now = new Date();

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
}
