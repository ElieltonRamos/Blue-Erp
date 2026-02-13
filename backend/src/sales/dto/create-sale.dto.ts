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
  @ApiProperty({ description: 'ID do produto', example: 1 })
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: 'Quantidade', example: 2.5 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Preço unitário', example: 45.0 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({
    description: 'ID do cliente (padrão: 1 - Cliente À Vista)',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiProperty({ description: 'Método de pagamento', example: 'DINHEIRO' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ description: 'Itens da venda', type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiPropertyOptional({
    description: 'Desconto aplicado',
    example: 10.5,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'CFOP da operação',
    example: '5102',
    default: '5102',
  })
  @IsString()
  @IsOptional()
  cfop?: string;
}
