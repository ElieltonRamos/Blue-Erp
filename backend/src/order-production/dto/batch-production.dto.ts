// src/production/dto/batch-production.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchProductionDto {
  @ApiProperty({
    description: 'IDs das produções a serem processadas',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'productionIds deve ser um array' })
  @ArrayMinSize(1, { message: 'Pelo menos uma produção deve ser informada' })
  @IsInt({ each: true, message: 'Todos os IDs devem ser números inteiros' })
  @Type(() => Number)
  productionIds: number[];
}
