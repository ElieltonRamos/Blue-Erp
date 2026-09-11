import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { DocumentType } from '../../../../generated/prisma/enums.js';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.QUOTE })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ example: 1 })
  @IsInt()
  clientId: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  assetId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  responsibleId?: number;
}
