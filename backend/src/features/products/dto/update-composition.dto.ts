import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ValidationMessages } from 'src/common/utils/validation';

export class CompositionItemDto {
  @ApiPropertyOptional({
    description: 'ID da matéria-prima (obrigatório se subProductId não for informado)',
    example: 1,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('A matéria-prima') })
  materialId?: number | null;

  @ApiPropertyOptional({
    description: 'ID do produto semipronto (obrigatório se materialId não for informado)',
    example: 5,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O subproduto') })
  subProductId?: number | null;

  @ApiProperty({ description: 'Quantidade', minimum: 0.001, example: 0.5 })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: ValidationMessages.IS_DECIMAL('A quantidade', 3) })
  @Min(0.001, { message: ValidationMessages.MIN('A quantidade', 0.001) })
  quantity: number;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O custo unitário', 2) })
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Farinha de trigo' })
  @IsOptional()
  @IsString({ message: ValidationMessages.IS_STRING('O nome da matéria-prima') })
  materialName?: string;
}

export class UpdateCompositionDto {
  @ApiProperty({ description: 'Lista de itens da composição (matérias-primas ou semiprontos)', type: [CompositionItemDto] })
  @IsArray({ message: ValidationMessages.IS_ARRAY('A composição') })
  @ValidateNested({ each: true })
  @Type(() => CompositionItemDto)
  composition: CompositionItemDto[];
}
