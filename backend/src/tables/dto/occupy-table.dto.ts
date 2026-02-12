// src/tables/dto/occupy-table.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OccupyTableDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  customer: string;
}
