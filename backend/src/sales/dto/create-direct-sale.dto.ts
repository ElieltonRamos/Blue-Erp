import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalePaymentDto } from './create-sale.dto.js';

export class CreateDirectSaleItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'productId deve ser um número inteiro' })
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt({ message: 'serviceId deve ser um número inteiro' })
  @IsOptional()
  serviceId?: number;

  @ApiProperty({ example: 2 })
  @IsNumber({}, { message: 'quantity deve ser um número' })
  @Min(0.001, { message: 'quantity deve ser maior que zero' })
  quantity!: number;

  @ApiProperty({ example: 25.9 })
  @IsNumber({}, { message: 'unitPrice deve ser um número' })
  @Min(0, { message: 'unitPrice não pode ser negativo' })
  unitPrice!: number;
}

export class CreateDirectSaleDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber({}, { message: 'clientId deve ser um número' })
  @IsOptional()
  clientId?: number;

  @ApiProperty({ type: [CreateSalePaymentDto] })
  @IsArray({ message: 'payments deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments!: CreateSalePaymentDto[];

  @ApiProperty({ type: [CreateDirectSaleItemDto] })
  @IsArray({ message: 'items deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => CreateDirectSaleItemDto)
  items!: CreateDirectSaleItemDto[];

  @ApiPropertyOptional({ example: 10.5, default: 0 })
  @IsNumber({}, { message: 'discount deve ser um número' })
  @IsOptional()
  @Min(0, { message: 'discount não pode ser negativo' })
  discount?: number;

  @ApiPropertyOptional({ example: '5102', default: '5102' })
  @IsString({ message: 'cfop deve ser um texto' })
  @IsOptional()
  cfop?: string;
}
