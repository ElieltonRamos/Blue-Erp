import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ValidationMessages } from 'src/common/validation-messages';

export class CreateServiceDto {
  @ApiProperty({ example: 'Troca de óleo' })
  @IsString({ message: ValidationMessages.IS_STRING('Nome') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Nome') })
  name: string;

  @ApiProperty({ type: Number, example: 80.0 })
  @IsNumber({}, { message: ValidationMessages.IS_NUMBER('Preço') })
  @Min(0, { message: ValidationMessages.MIN('Preço', 0) })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Preço') })
  price: number;

  @ApiProperty({
    type: Number,
    required: false,
    example: 30,
    description: 'Tempo estimado em minutos',
  })
  @IsNumber({}, { message: ValidationMessages.IS_NUMBER('Tempo estimado') })
  @Min(0, { message: ValidationMessages.MIN('Tempo estimado', 0) })
  @IsOptional()
  estimatedTime?: number;
}
