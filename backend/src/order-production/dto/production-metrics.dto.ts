import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductionMetricsDto {
  @ApiProperty({
    description: 'Local de produção',
    example: 'LOCAL_01',
  })
  productionLocation: string;

  @ApiProperty({
    description: 'Total de produções',
    example: 45,
  })
  total: number;

  @ApiProperty({
    description: 'Quantidade de produções pendentes',
    example: 5,
  })
  pending: number;

  @ApiProperty({
    description: 'Quantidade de produções em andamento',
    example: 8,
  })
  inProgress: number;

  @ApiProperty({
    description: 'Quantidade de produções completadas',
    example: 30,
  })
  completed: number;

  @ApiProperty({
    description: 'Quantidade de produções entregues',
    example: 25,
  })
  delivered: number;

  @ApiPropertyOptional({
    description: 'Tempo médio em pendente (minutos)',
    example: 5.3,
  })
  averagePendingTimeMinutes: number | null;

  @ApiPropertyOptional({
    description: 'Tempo médio em progresso (minutos)',
    example: 12.7,
  })
  averageInProgressTimeMinutes: number | null;

  @ApiPropertyOptional({
    description: 'Tempo médio total (minutos)',
    example: 18.0,
  })
  averageTotalTimeMinutes: number | null;
}
