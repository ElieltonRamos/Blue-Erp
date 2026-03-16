import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ description: 'Número da mesa', example: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ description: 'Capacidade de pessoas', example: 4 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ description: 'ID da localização', example: 1 })
  @IsInt()
  @Min(1)
  locationId: number;
}
