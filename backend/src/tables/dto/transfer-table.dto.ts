import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TransferTableDto {
  @ApiProperty({ description: 'Número da mesa destino', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetTableNumber: number;

  @ApiProperty({
    description: 'Código do local da mesa destino',
    example: 'LOCAL_01',
  })
  @IsString()
  targetLocationCode: string;
}
