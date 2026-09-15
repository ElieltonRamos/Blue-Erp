// dto/response-report-workshop.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkshopReportSummaryDto {
  @ApiProperty({ example: 42 })
  totalDocuments: number;

  @ApiProperty({ example: 15400.5 })
  totalRevenue: number;

  @ApiProperty({ example: 366.68 })
  averageTicket: number;

  @ApiProperty({ example: 28 })
  vehiclesServed: number;

  @ApiProperty({ example: 3 })
  documentsWithoutVehicle: number;
}

export class WorkshopReportTopVehicleDto {
  @ApiProperty({ example: 5 })
  assetId: number;

  @ApiProperty({ example: 'ABC-1234' })
  label: string;

  @ApiProperty({ example: 'João Silva' })
  clientName: string;

  @ApiProperty({ example: 4 })
  visits: number;

  @ApiProperty({ example: 1850.0 })
  totalValue: number;
}

export class WorkshopReportVehicleDto {
  @ApiProperty({ example: 5 })
  assetId: number;

  @ApiProperty({ example: 'ABC-1234' })
  label: string;

  @ApiProperty({ example: 'João Silva' })
  clientName: string;

  @ApiProperty({ example: 4 })
  visits: number;

  @ApiProperty({ example: 1850.0 })
  totalValue: number;

  @ApiPropertyOptional({ example: '2024-01-15T00:00:00.000Z' })
  lastVisit: Date | null;
}

export class WorkshopReportNoVehicleDto {
  @ApiProperty({ example: 3 })
  totalDocuments: number;

  @ApiProperty({ example: 890.0 })
  totalValue: number;
}

export class WorkshopReportDataDto {
  @ApiProperty({ type: () => WorkshopReportSummaryDto })
  summary: WorkshopReportSummaryDto;

  @ApiProperty({ type: () => [WorkshopReportTopVehicleDto] })
  topVehicles: WorkshopReportTopVehicleDto[];

  @ApiProperty({ type: () => [WorkshopReportVehicleDto] })
  vehicles: WorkshopReportVehicleDto[];

  @ApiProperty({ type: () => WorkshopReportNoVehicleDto })
  noVehicle: WorkshopReportNoVehicleDto;
}

export class WorkshopReportResponseDto {
  @ApiProperty({ example: 'OK' })
  status: string;

  @ApiPropertyOptional({ example: 'Erro ao gerar relatório' })
  message?: string;

  @ApiPropertyOptional({ type: () => WorkshopReportDataDto })
  data?: WorkshopReportDataDto;
}
