import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FiscalStatus } from 'generated/prisma/client';
import { CreateSalePaymentDto } from './create-sale.dto';

export class UpdateSaleItemDto {
  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  id?: number;

  @IsInt()
  productId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class UpdateSaleDto {
  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional({ type: [CreateSalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  @IsOptional()
  payments?: CreateSalePaymentDto[];

  @ApiPropertyOptional({ type: [UpdateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemDto)
  @IsOptional()
  items?: UpdateSaleItemDto[];

  @ApiPropertyOptional({ example: 15.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  serviceCharge?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ enum: FiscalStatus, example: FiscalStatus.EMITIDA })
  @IsEnum(FiscalStatus)
  @IsOptional()
  fiscalStatus?: FiscalStatus;

  @ApiPropertyOptional({ example: '5102' })
  @IsOptional()
  cfop?: string;
}
