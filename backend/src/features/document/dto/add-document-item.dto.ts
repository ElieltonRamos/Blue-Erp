import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { DocumentItemType } from 'generated/prisma/enums';

export class AddDocumentItemDto {
  @ApiProperty({ enum: DocumentItemType, example: DocumentItemType.SERVICE })
  @IsEnum(DocumentItemType)
  type: DocumentItemType;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  serviceId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  mechanicId?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}
