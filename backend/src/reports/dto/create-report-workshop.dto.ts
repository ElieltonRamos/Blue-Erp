// dto/create-report-workshop.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class WorkshopReportFilterDto {
  @ApiProperty({
    description: 'Data de início do período',
    example: '2024-01-01',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Data de fim do período',
    example: '2024-01-31',
    type: String,
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
