import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductionStatus } from 'generated/prisma/client';

export class ProductionResponseDto {
  @ApiProperty({
    description: 'ID da produção',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID do item do pedido',
    example: 5,
  })
  orderItemId: number;

  @ApiProperty({
    description: 'Local de produção',
    example: 'LOCAL_01',
  })
  productionLocation: string;

  @ApiProperty({
    description: 'Status da produção',
    enum: ProductionStatus,
    example: 'PENDING',
  })
  status: ProductionStatus;

  @ApiProperty({
    description: 'Quantidade solicitada',
    example: 2.5,
  })
  quantityRequested: number;

  @ApiProperty({
    description: 'Quantidade produzida',
    example: 0,
  })
  quantityProduced: number;

  @ApiProperty({
    description: 'Data/hora que entrou em pendente',
    example: '2025-02-07T10:30:00.000Z',
  })
  pendingAt: Date;

  @ApiPropertyOptional({
    description: 'Data/hora que iniciou a produção',
    example: '2025-02-07T10:35:00.000Z',
  })
  startedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Data/hora que completou a produção',
    example: '2025-02-07T10:45:00.000Z',
  })
  completedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Data/hora que foi entregue',
    example: '2025-02-07T10:50:00.000Z',
  })
  deliveredAt: Date | null;

  @ApiPropertyOptional({
    description: 'Duração em pendente (minutos)',
    example: 5,
  })
  pendingDuration: number | null;

  @ApiPropertyOptional({
    description: 'Duração em progresso (minutos)',
    example: 10,
  })
  inProgressDuration: number | null;

  @ApiPropertyOptional({
    description: 'Duração após completar até entregar (minutos)',
    example: 5,
  })
  completedDuration: number | null;

  @ApiPropertyOptional({
    description: 'Duração total (minutos)',
    example: 20,
  })
  totalDuration: number | null;

  @ApiPropertyOptional({
    description: 'Dados do item do pedido',
  })
  orderItem?: any;
}
