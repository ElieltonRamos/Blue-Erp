// src/tables/dto/reserve-table.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReserveTableDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({ description: 'Horário da reserva', example: '20:00' })
  @IsString()
  @IsNotEmpty()
  time: string;
}
