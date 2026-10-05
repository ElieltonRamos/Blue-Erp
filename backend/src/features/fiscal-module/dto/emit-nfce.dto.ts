// src/fiscal-module/dto/emit-nfce.dto.ts
import { IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmitNfceDto {
  @ApiProperty({ description: 'Sale ID', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  saleId: number;

  @ApiPropertyOptional({ description: 'Generate DANFE PDF', default: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  generateDanfe?: boolean = true;
}
