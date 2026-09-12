import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

export class CloseCommissionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  mechanicId: number;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString()
  periodEnd: string;
}
