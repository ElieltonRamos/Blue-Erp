import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ValidationMessages } from 'src/common/validation-messages';
import { AssetAttributeDto } from './asset-attribute.dto';

export class CreateAssetDto {
  @ApiProperty({ example: 'VEHICLE' })
  @IsString({ message: ValidationMessages.IS_STRING('Tipo') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Tipo') })
  type: string;

  @ApiProperty({
    example: 'ABC-1234',
    description: 'Identificador do asset (ex: placa)',
  })
  @IsString({ message: ValidationMessages.IS_STRING('Identificador') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Identificador') })
  label: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_NUMBER('Cliente') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Cliente') })
  clientId: number;

  @ApiPropertyOptional({ type: [AssetAttributeDto] })
  @IsArray({ message: 'Atributos deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => AssetAttributeDto)
  @IsOptional()
  attributes?: AssetAttributeDto[];
}
