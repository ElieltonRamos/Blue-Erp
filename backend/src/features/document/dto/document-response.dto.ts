import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/index-browser';
import {
  DocumentStatus,
  DocumentType,
} from '../../../../generated/prisma/enums.js';
import { DocumentItemResponseDto } from './document-item-response.dto.js';

export class DocumentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 'João Silva' })
  clientName: string;

  @ApiProperty({ example: 1, required: false })
  assetId: number | null;

  @ApiProperty({ example: 1, required: false })
  responsibleId: number | null;

  @ApiProperty({ example: 350.0 })
  total: Decimal;

  @ApiProperty({ type: [DocumentItemResponseDto] })
  items: DocumentItemResponseDto[];

  @ApiProperty({ required: false })
  approvedAt?: Date | null;

  @ApiProperty({ required: false })
  finishedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(
    partial: Partial<DocumentResponseDto> & { client?: { name: string } },
  ) {
    const { client, items, ...rest } = partial as any;
    Object.assign(this, rest);
    if (client?.name) {
      this.clientName = client.name;
    }
    if (items) {
      this.items = items.map((i: any) => new DocumentItemResponseDto(i));
    }
  }
}
