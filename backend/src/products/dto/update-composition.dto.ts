// update-composition.dto.ts
import {
  IsInt,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CompositionItemDto {
  @ApiProperty({
    description: 'ID da matéria-prima',
    example: 1,
  })
  @IsInt({ message: 'ID da matéria-prima deve ser um número inteiro' })
  materialId: number;

  @ApiProperty({
    description: 'Quantidade da matéria-prima',
    minimum: 0.001,
    example: 0.5,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ required: false })
  @IsNumber()
  unitCost: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  materialName?: string;
}
export class UpdateCompositionDto {
  @ApiProperty({
    description: 'Lista de matérias-primas da composição',
    type: [CompositionItemDto],
  })
  @IsArray({ message: 'Composição deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CompositionItemDto)
  composition: CompositionItemDto[];
}
