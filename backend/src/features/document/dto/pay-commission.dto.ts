import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class PayCommissionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  mechanicId: number;

  @ApiProperty({ example: '2026-09-01', required: false })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiProperty({ example: '2026-09-15', required: false })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
