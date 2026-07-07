// src/orders/dto/auto-closed-order.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AutoClosedOrderDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  locationId: string;

  @ApiProperty({ required: false, nullable: true })
  table: string | null;

  @ApiProperty({ required: false, nullable: true })
  customerName: string | null;

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
