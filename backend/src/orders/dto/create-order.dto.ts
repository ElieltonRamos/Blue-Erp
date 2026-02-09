import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from 'generated/prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'ID do produto', example: 1 })
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Código do produto', example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nome do produto', example: 'Filé Mignon' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Quantidade', example: 2, minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Preço unitário', example: 45.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total do item', example: 90.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Tipo do pedido',
    enum: OrderType,
    example: 'DINE_IN',
  })
  @IsString()
  @IsNotEmpty()
  type: OrderType;

  @ApiProperty({
    description: 'Local do pedido (código)',
    example: 'LOCAL_01',
  })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Mesa (obrigatório se type === DINE_IN)',
    example: 'Mesa 5',
  })
  @ValidateIf((o) => o.type === 'DINE_IN')
  @IsString()
  @IsNotEmpty()
  table?: string;

  @ApiPropertyOptional({
    description: 'Endereço de entrega (obrigatório se type === DELIVERY)',
    example: 'Rua das Flores, 123 - Centro',
  })
  @ValidateIf((o) => o.type === 'DELIVERY')
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiProperty({
    description: 'Itens do pedido',
    type: [CreateOrderItemDto],
    example: [
      {
        productId: 1,
        code: 'PROD-001',
        name: 'Filé Mignon',
        quantity: 2,
        unitPrice: 45.0,
        total: 90.0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Total do pedido',
    example: 90.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({
    description: 'ID do operador',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  operatorId?: number;
}
