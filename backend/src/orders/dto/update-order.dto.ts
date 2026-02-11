import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from 'generated/prisma/client';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ description: 'ID do item', example: 1 })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional({ description: 'ID do produto', example: 1 })
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiPropertyOptional({
    description: 'Código do produto',
    example: 'PROD-001',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'Nome do produto',
    example: 'Filé Mignon',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Quantidade', example: 2 })
  @IsNumber()
  @Min(0.001)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Preço unitário', example: 45.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Total do item', example: 90.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  total?: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva Jr',
  })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Mesa', example: 'Mesa 6' })
  @IsString()
  @IsOptional()
  table?: string;

  @ApiPropertyOptional({
    description: 'Endereço de entrega',
    example: 'Rua Nova, 456',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Status do pedido',
    enum: OrderStatus,
    example: 'OPEN',
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Itens do pedido (substitui todos)',
    type: [UpdateOrderItemDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Total do pedido', example: 100.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  total?: number;
}
