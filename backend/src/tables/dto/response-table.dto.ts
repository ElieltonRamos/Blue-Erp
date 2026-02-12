// src/tables/dto/table-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from 'generated/prisma/client';

export class TableLocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'LOCAL_01' })
  code: string;

  @ApiProperty({ example: 'Salão Principal' })
  name: string;

  constructor(data: any) {
    this.id = data.id;
    this.code = data.code;
    this.name = data.name;
  }
}

export class TableOrderItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PROD-001' })
  code: string;

  @ApiProperty({ example: 'Filé Mignon' })
  name: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 45.0 })
  unitPrice: number;

  @ApiProperty({ example: 90.0 })
  total: number;

  @ApiProperty({ example: 1 })
  productId: number;

  constructor(data: any) {
    this.id = data.id;
    this.code = data.code;
    this.name = data.name;
    this.quantity = Number(data.quantity);
    this.unitPrice = Number(data.unitPrice);
    this.total = Number(data.total);
    this.productId = data.productId;
  }
}

export class TableOrderDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DINE_IN' })
  type: string;

  @ApiProperty({ example: 'LOCAL_01' })
  locationId: string;

  @ApiPropertyOptional({ example: 'João Silva' })
  customerName: string | null;

  @ApiProperty({ example: 'OPEN' })
  status: string;

  @ApiProperty({ example: 90.0 })
  total: number;

  @ApiProperty({ type: [TableOrderItemDto] })
  items: TableOrderItemDto[];

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.type = data.type;
    this.locationId = data.locationId;
    this.customerName = data.customerName;
    this.status = data.status;
    this.total = Number(data.total);
    this.items = (data.items || []).map((i: any) => new TableOrderItemDto(i));
    this.createdAt = data.createdAt;
  }
}

export class TableResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  number: number;

  @ApiProperty({ example: 4 })
  capacity: number;

  @ApiProperty({
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
    example: 'AVAILABLE',
  })
  status: TableStatus;

  @ApiPropertyOptional({ example: 'João Silva' })
  customer: string | null;

  @ApiPropertyOptional({ example: '20:00' })
  time: string | null;

  @ApiProperty({ example: 1 })
  locationId: number;

  @ApiProperty({ type: TableLocationDto })
  location: TableLocationDto;

  @ApiPropertyOptional({ example: 1 })
  orderId: number | null;

  @ApiPropertyOptional({ type: TableOrderDto, nullable: true })
  order: TableOrderDto | null;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.number = data.number;
    this.capacity = data.capacity;
    this.status = data.status;
    this.customer = data.customer;
    this.time = data.time;
    this.locationId = data.locationId;
    this.location = data.location
      ? new TableLocationDto(data.location)
      : data.location;
    this.orderId = data.orderId;
    this.order = data.order ? new TableOrderDto(data.order) : null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class CloseTabResponseDto {
  @ApiProperty({ example: 1, description: 'ID da order fechada' })
  orderId: number;

  @ApiProperty({ example: 150.5, description: 'Total da comanda' })
  total: number;

  @ApiProperty({ example: 'Comanda fechada para a mesa 5' })
  message: string;

  constructor(data: { orderId: number; total: any; message: string }) {
    this.orderId = data.orderId;
    this.total = Number(data.total);
    this.message = data.message;
  }
}
