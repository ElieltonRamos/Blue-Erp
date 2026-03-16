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
    description:
      'ID da matéria-prima (obrigatório se subProductId não for informado)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da matéria-prima deve ser um número inteiro' })
  materialId?: number;

  @ApiProperty({
    description:
      'ID do produto semipronto (obrigatório se materialId não for informado)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do subproduto deve ser um número inteiro' })
  subProductId?: number;

  @ApiProperty({
    description: 'Quantidade',
    minimum: 0.001,
    example: 0.5,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0.001, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  materialName?: string;
}

export class UpdateCompositionDto {
  @ApiProperty({
    description:
      'Lista de itens da composição (matérias-primas ou semiprontos)',
    type: [CompositionItemDto],
  })
  @IsArray({ message: 'Composição deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CompositionItemDto)
  composition: CompositionItemDto[];
}
