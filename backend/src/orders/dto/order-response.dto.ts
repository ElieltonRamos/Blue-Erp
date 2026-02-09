import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType } from 'generated/prisma/client';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'ID do item', example: 1 })
  id: number;

  @ApiProperty({ description: 'Código do produto', example: 'PROD-001' })
  code: string;

  @ApiProperty({ description: 'Nome do produto', example: 'Filé Mignon' })
  name: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Preço unitário', example: 45.0 })
  unitPrice: number;

  @ApiProperty({ description: 'Total do item', example: 90.0 })
  total: number;

  @ApiPropertyOptional({
    description: 'Data/hora que ficou pronto na cozinha',
    example: '2024-01-15T14:30:00Z',
  })
  kitchenReadyAt?: Date;

  @ApiProperty({ description: 'ID do produto', example: 1 })
  productId: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'ID do pedido', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Tipo do pedido',
    enum: OrderType,
    example: 'DINE_IN',
  })
  type: OrderType;

  @ApiProperty({
    description: 'Local do pedido',
    example: 'LOCAL_01',
  })
  locationId: string;

  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  customerName?: string;

  @ApiPropertyOptional({ description: 'Mesa', example: 'Mesa 5' })
  table?: string;

  @ApiPropertyOptional({
    description: 'Endereço de entrega',
    example: 'Rua das Flores, 123',
  })
  address?: string;

  @ApiProperty({
    description: 'Status do pedido',
    enum: OrderStatus,
    example: 'OPEN',
  })
  status: OrderStatus;

  @ApiProperty({ description: 'Total do pedido', example: 90.0 })
  total: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Data/hora enviado para cozinha',
    example: '2024-01-15T10:05:00Z',
  })
  kitchenSentAt?: Date;

  @ApiPropertyOptional({
    description: 'Data/hora que ficou pronto',
    example: '2024-01-15T10:30:00Z',
  })
  kitchenReadyAt?: Date;

  @ApiPropertyOptional({
    description: 'Data/hora finalizado',
    example: '2024-01-15T10:35:00Z',
  })
  finishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Data/hora entregue (delivery)',
    example: '2024-01-15T11:00:00Z',
  })
  deliveredAt?: Date;

  @ApiPropertyOptional({
    description: 'Data/hora mesa liberada',
    example: '2024-01-15T11:00:00Z',
  })
  tableOccupiedUtil?: Date;

  @ApiPropertyOptional({ description: 'ID do operador', example: 1 })
  operatorId?: number;

  @ApiProperty({
    description: 'Itens do pedido',
    type: [OrderItemResponseDto],
    isArray: true,
  })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({
    description: 'Informações do operador',
    example: { id: 1, username: 'joao.silva' },
  })
  operator?: {
    id: number;
    username: string;
  };
}
