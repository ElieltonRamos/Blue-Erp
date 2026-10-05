import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevenueReportQueryDto {
  @ApiProperty({ example: '03', description: 'Month (01-12)' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'month must be between 01 and 12' })
  month: string;

  @ApiProperty({ example: '2026', description: 'Year (YYYY)' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'year must be a 4-digit number' })
  year: string;
}
