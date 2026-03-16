// src/tables/dto/update-table.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTableDto {
  @ApiPropertyOptional({ description: 'Número da mesa', example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  number?: number;

  @ApiPropertyOptional({ description: 'Capacidade de pessoas', example: 4 })
  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ description: 'ID da localização', example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  locationId?: number;

  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  customer?: string;
}
