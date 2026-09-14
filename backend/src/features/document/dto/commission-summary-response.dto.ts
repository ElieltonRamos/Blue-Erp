import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/index-browser';

export class CommissionSummaryResponseDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'joao.mecanico' })
  userName: string;

  @ApiProperty({ example: 12 })
  itemsCount: number;

  @ApiProperty({ example: 1500.0 })
  totalLabor: Decimal | number;

  @ApiProperty({ example: 40.0, required: false })
  commissionRate?: Decimal | number | null;

  @ApiProperty({ example: 600.0 })
  totalCommission: Decimal | number;

  constructor(partial: Partial<CommissionSummaryResponseDto>) {
    Object.assign(this, partial);
  }
}
