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

export class LocationReportLocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'REST_A' })
  code: string;

  @ApiProperty({ example: 'Restaurante A' })
  name: string;

  @ApiProperty({ example: 1840.5 })
  totalValue: number;

  @ApiProperty({ example: 'Cerveja Long Neck' })
  topProduct: string;

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
