import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Bebidas' })
  name: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: false, description: 'Se aparece no cardápio online' })
  onlineVisible: boolean;

  @ApiProperty({ example: 0, description: 'Ordem de exibição no cardápio online' })
  onlineSortOrder: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
