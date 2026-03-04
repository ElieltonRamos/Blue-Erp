import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationReportItemDto {
  @ApiProperty({ example: 'Cerveja Long Neck' })
  name: string;

  @ApiProperty({ example: 42 })
  qty: number;

  @ApiProperty({ example: 504.0 })
  value: number;

  @ApiProperty({ example: 'Bar Central' })
  producedAt: string;
}

export class LocationReportCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  name: string;

  @ApiProperty({ example: 980.0 })
  totalValue: number;

  @ApiProperty({ example: 87 })
  totalQty: number;

  @ApiProperty({ type: () => [LocationReportItemDto] })
  items: LocationReportItemDto[];
}

export class LocationReportOperatorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'joao.silva' })
  username: string;

  @ApiProperty({ example: 12, description: 'Comandas abertas' })
  opened: number;

  @ApiProperty({ example: 10, description: 'Comandas fechadas' })
  closed: number;

  @ApiProperty({
    example: 1840.5,
    description: 'Valor total das comandas abertas',
  })
  totalValue: number;
}

export class LocationReportLocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'REST_A' })
  code: string;

  @ApiProperty({ example: 'Restaurante A' })
  name: string;

  @ApiProperty({ example: 1840.5 })
  totalValue: number;

  @ApiProperty({ example: 38 })
  totalOrders: number;

  @ApiProperty({ example: 'Cerveja Long Neck' })
  topProduct: string;

  @ApiPropertyOptional({
    example: 47.5,
    description: 'Tempo médio de comanda em minutos',
  })
  averageCommandaMinutes: number | null;

  @ApiPropertyOptional({
    example: 62.3,
    description: 'Tempo médio de ocupação de mesa em minutos',
  })
  averageTableOccupationMinutes: number | null;

  @ApiProperty({ type: () => [LocationReportOperatorDto] })
  operators: LocationReportOperatorDto[];

  @ApiProperty({ type: () => [LocationReportCategoryDto] })
  categories: LocationReportCategoryDto[];
}

export class LocationReportDataDto {
  @ApiProperty({ type: () => [LocationReportLocationDto] })
  locations: LocationReportLocationDto[];
}

export class LocationReportResponseDto {
  @ApiProperty({ example: 'OK' })
  status: string;

  @ApiPropertyOptional({ example: 'Erro ao gerar relatório' })
  message?: string;

  @ApiPropertyOptional({ type: () => LocationReportDataDto })
  data?: LocationReportDataDto;
}
