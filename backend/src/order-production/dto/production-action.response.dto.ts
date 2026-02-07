import { ApiProperty } from '@nestjs/swagger';
import { ProductionStatus } from 'generated/prisma/client';

export class ProductionActionResponseDto {
  @ApiProperty({
    description: 'ID da produção',
    example: 1,
  })
  id?: number;

  @ApiProperty({
    description: 'ID da produção (alternativo)',
    example: 1,
  })
  productionId?: number;

  @ApiProperty({
    description: 'Status da produção após a ação',
    enum: ProductionStatus,
    example: 'IN_PROGRESS',
  })
  status?: ProductionStatus;

  @ApiProperty({
    description: 'Data/hora que iniciou',
    example: '2025-02-07T10:35:00.000Z',
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'Data/hora que completou',
    example: '2025-02-07T10:45:00.000Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Data/hora que foi entregue',
    example: '2025-02-07T10:50:00.000Z',
  })
  deliveredAt?: Date;

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Produção iniciada com sucesso',
  })
  message: string;
}
