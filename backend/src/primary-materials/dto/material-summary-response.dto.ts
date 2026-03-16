import { ApiProperty } from '@nestjs/swagger';

export class MaterialSummaryResponseDto {
  @ApiProperty({
    description: 'Total de matérias-primas cadastradas',
    example: 150,
  })
  totalMaterials: number;

  @ApiProperty({
    description: 'Quantidade de matérias-primas ativas',
    example: 120,
  })
  activeMaterials: number;

  @ApiProperty({
    description: 'Quantidade de matérias-primas inativas',
    example: 30,
  })
  inactiveMaterials: number;

  @ApiProperty({
    description: 'Valor total do estoque (soma de currentStock * unitCost)',
    example: 45680.5,
  })
  totalStockValue: number;

  @ApiProperty({
    description: 'Quantidade de matérias-primas com estoque baixo',
    example: 15,
  })
  materialsLowStock: number;

  @ApiProperty({
    description: 'Soma total de itens em estoque',
    example: 5000,
  })
  totalItems: number;
}
