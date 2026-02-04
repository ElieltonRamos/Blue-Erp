import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Unit } from 'generated/prisma/client';

export class StockAlertResponseDto {
  @ApiProperty({
    description: 'ID da matéria-prima',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome da matéria-prima',
    example: 'Farinha de Trigo',
  })
  name: string;

  @ApiProperty({
    description: 'Código único da matéria-prima',
    example: 'MP-001',
  })
  code: string;

  @ApiProperty({
    description: 'Unidade de medida',
    enum: Unit,
    example: 'KG',
  })
  unit: Unit;

  @ApiProperty({
    description: 'Estoque atual',
    example: 5,
  })
  currentStock: number;

  @ApiPropertyOptional({
    description: 'Estoque mínimo',
    example: 20,
  })
  minStock?: number;

  @ApiProperty({
    description: 'Custo unitário',
    example: 5.5,
  })
  unitCost: number;

  @ApiProperty({
    description: 'Valor estimado do estoque (currentStock * unitCost)',
    example: 27.5,
  })
  estimatedValue: number;
}
