// update-preparation.dto.ts
import {
  IsInt,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PreparationStepDto {
  @ApiProperty({
    description: 'Ordem do passo',
    minimum: 1,
    example: 1,
  })
  @IsInt({ message: 'Ordem deve ser um número inteiro' })
  @Min(1, { message: 'Ordem deve ser maior que zero' })
  order: number;

  @ApiProperty({
    description: 'Descrição do passo',
    minLength: 3,
    example: 'Misture todos os ingredientes secos em uma tigela',
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @MinLength(3, { message: 'Descrição deve ter no mínimo 3 caracteres' })
  description: string;
}

export class UpdatePreparationDto {
  @ApiProperty({
    description: 'Lista de passos de preparo',
    type: [PreparationStepDto],
  })
  @IsArray({ message: 'Preparo deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => PreparationStepDto)
  steps: PreparationStepDto[];
}
