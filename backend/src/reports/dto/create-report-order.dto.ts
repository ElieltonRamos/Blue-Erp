import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class OrderReportFilterDto {
  @ApiProperty({
    description: 'Data de início do período (formato: YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsDateString(
    {},
    { message: 'Data de início deve estar no formato YYYY-MM-DD' },
  )
  startDate: string;

  @ApiProperty({
    description: 'Data de fim do período (formato: YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @IsNotEmpty({ message: 'Data de fim é obrigatória' })
  @IsDateString({}, { message: 'Data de fim deve estar no formato YYYY-MM-DD' })
  endDate: string;
}
