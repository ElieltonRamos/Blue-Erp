import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Table } from 'generated/prisma/client';

type Client = Prisma.TransactionClient | PrismaClient;

@Injectable()
export class OrderTableService {
  parseTableNumber(table: string): number | null {
    const tableNumber = parseInt(table.replace('Mesa ', '').trim(), 10);
    return isNaN(tableNumber) ? null : tableNumber;
  }

  async findTableRecord(
    client: Client,
    table: string,
    locationCode: string,
  ): Promise<Table | null> {
    const tableNumber = this.parseTableNumber(table);
    if (tableNumber === null) return null;

    const location = await client.productionLocation.findFirst({
      where: { code: locationCode },
    });
    if (!location) return null;

    return client.table.findUnique({
      where: {
        number_locationId: {
          number: tableNumber,
          locationId: location.id,
        },
      },
    });
  }

  async findByOrderId(client: Client, orderId: number): Promise<Table | null> {
    return client.table.findUnique({ where: { orderId } });
  }

  async occupy(
    client: Client,
    tableId: number,
    orderId: number,
    customerName: string | null | undefined,
  ): Promise<void> {
    await client.table.update({
      where: { id: tableId },
      data: {
        status: 'OCCUPIED',
        orderId,
        customer: customerName ?? null,
        time: null,
      },
    });
  }

  async release(client: Client, tableId: number): Promise<void> {
    await client.table.update({
      where: { id: tableId },
      data: {
        status: 'AVAILABLE',
        customer: null,
        time: null,
        orderId: null,
      },
    });
  }
}
