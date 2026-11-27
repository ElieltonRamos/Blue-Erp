import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ValidationMessages, trim } from 'src/common/utils/validation';

export class PreparationStepDto {
  @ApiProperty({
    description: 'Ordem do passo',
    minimum: 1,
    example: 1,
  })
  @IsInt({ message: ValidationMessages.IS_INT('A ordem') })
  @Min(1, { message: ValidationMessages.MIN('A ordem', 1) })
  order: number;

  @ApiProperty({
    description: 'Descrição do passo',
    minLength: 3,
    example: 'Misture todos os ingredientes secos em uma tigela',
  })
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A descrição') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('A descrição') })
  @MinLength(3, { message: ValidationMessages.MIN_LENGTH('A descrição', 3) })
  description: string;
}

export class UpdatePreparationDto {
  @ApiProperty({
    description: 'Lista de passos de preparo',
    type: [PreparationStepDto],
  })
  @IsArray({ message: ValidationMessages.IS_ARRAY('Os passos de preparo') })
  @ValidateNested({ each: true })
  @Type(() => PreparationStepDto)
  steps: PreparationStepDto[];
}
