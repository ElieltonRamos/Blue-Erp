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

  @ApiProperty({ example: 'Filtro de óleo', required: false })
  productName?: string;

  @ApiProperty({ example: 1, required: false })
  serviceId: number | null;

  @ApiProperty({ example: 'Troca de óleo', required: false })
  serviceName?: string;

  @ApiProperty({ example: 1, required: false })
  mechanicId: number | null;

  @ApiProperty({ example: 'joao.mecanico', required: false })
  mechanicName?: string;

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

  constructor(
    partial: Partial<DocumentItemResponseDto> & {
      product?: { name: string } | null;
      service?: { name: string } | null;
      mechanic?: { username: string } | null;
    },
  ) {
    const { product, service, mechanic, ...rest } = partial as any;
    Object.assign(this, rest);
    if (product?.name) this.productName = product.name;
    if (service?.name) this.serviceName = service.name;
    if (mechanic?.username) this.mechanicName = mechanic.username;
  }
}
