import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  productId!: number;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ example: 45.0 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice!: number;
}

export class CreateSalePaymentDto {
  @ApiProperty({ example: 'PIX' })
  @IsString()
  @IsNotEmpty()
  method!: string;

  @ApiProperty({ example: 60.0 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 10.0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  change?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiProperty({ type: [CreateSalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments!: CreateSalePaymentDto[];

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiPropertyOptional({ example: 10.5, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: '5102', default: '5102' })
  @IsString()
  @IsOptional()
  cfop?: string;
}
