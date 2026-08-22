import { IsEnum, IsString, IsOptional, IsNumber, Min } from 'class-validator';
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
  productId!: number;

  @ApiPropertyOptional({
    description: 'Observação do item',
    example: 'Sem cebola',
  })
  @IsString()
  @IsOptional()
  observation?: string;

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

  @ApiPropertyOptional({
    description: 'Taxa de serviço do item',
    example: 4.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;
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

  // Removido: 'items' e 'total'. Itens não são mais tratados por update()
  // — ver OrderItemsService.addItems() / OrderItemsService.removeItems().
  // 'total' é sempre derivado dos itens, nunca setável diretamente.

  @ApiPropertyOptional({ example: 15.05 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;
}
