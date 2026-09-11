import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/index-browser';
import { DocumentItemType } from '../../../../generated/prisma/enums.js';

export class DocumentItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: DocumentItemType })
  type: DocumentItemType;

  @ApiProperty({ example: 1, required: false })
  productId: number | null;

  @ApiProperty({ example: 1, required: false })
  serviceId: number | null;

  @ApiProperty({ example: 1, required: false })
  mechanicId: number | null;

  @ApiProperty({ example: 1 })
  quantity: Decimal;

  @ApiProperty({ example: 150.0 })
  unitPrice: Decimal;

  @ApiProperty({ example: 150.0 })
  total: Decimal;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
