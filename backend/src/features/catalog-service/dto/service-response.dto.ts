import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/index-browser';

export class ServiceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Troca de óleo' })
  name: string;

  @ApiProperty({ example: 'SRV-001' })
  code: string;

  @ApiProperty({ type: Number, example: 80.0 })
  price: Decimal;

  @ApiProperty({ type: Number, nullable: true, example: 30 })
  estimatedTime: number | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<ServiceResponseDto>) {
    Object.assign(this, partial);
  }
}
