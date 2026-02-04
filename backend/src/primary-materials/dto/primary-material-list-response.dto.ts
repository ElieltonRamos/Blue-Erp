import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Unit } from 'generated/prisma/client';

export class PrimaryMaterialResponseDto {
  @ApiProperty({
    description: 'ID da matéria-prima',
    example: '1',
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
    description: 'Custo unitário',
    example: 5.5,
  })
  unitCost: number;

  @ApiProperty({
    description: 'Estoque atual',
    example: 100,
  })
  currentStock: number;

  @ApiProperty({
    description: 'Status ativo/inativo',
    example: true,
  })
  active: boolean;

  @ApiPropertyOptional({
    description: 'NCM (Nomenclatura Comum do Mercosul)',
    example: '11010010',
    nullable: true,
  })
  ncm?: string | null;

  @ApiPropertyOptional({
    description: 'CFOP (Código Fiscal de Operações e Prestações)',
    example: '5102',
    nullable: true,
  })
  cfop?: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-20T14:45:00.000Z',
  })
  updatedAt: Date;
}
