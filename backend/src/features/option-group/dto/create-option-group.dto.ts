import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OptionGroupType } from 'generated/prisma/enums';
import { ValidationMessages, notUndefined, trim } from 'src/common/utils/validation';

export class CreateOptionDto {
  @ApiProperty({ description: 'Nome da opção', maxLength: 100, example: 'Bacon' })
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome da opção') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O nome da opção') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('O nome da opção', 100) })
  name: string;

  @ApiPropertyOptional({ description: 'Acréscimo no preço, por unidade', minimum: 0, default: 0, example: 4.5 })
  @ValidateIf(notUndefined)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O preço da opção', 2) })
  @Min(0, { message: ValidationMessages.MIN('O preço da opção', 0) })
  price?: number;

  @ApiPropertyOptional({ description: 'Se a opção está disponível para escolha', default: true, example: true })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('A disponibilidade da opção') })
  available?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição dentro do grupo. Sem valor, usa a posição na lista',
    minimum: 0,
    maximum: 9999,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem da opção') })
  @Min(0, { message: ValidationMessages.MIN('A ordem da opção', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem da opção', 9999) })
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'ID da matéria-prima ligada à opção. Opção indisponível quando o estoque dela é zero',
    example: 3,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('A matéria-prima') })
  materialId?: number | null;
}

export class CreateOptionGroupDto {
  @ApiProperty({ description: 'Nome do grupo de opções', maxLength: 100, example: 'Adicionais' })
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome do grupo') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O nome do grupo') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('O nome do grupo', 100) })
  name: string;

  @ApiProperty({
    description: 'Tipo do grupo: SINGLE escolhe uma opção, MULTIPLE escolhe várias com quantidade',
    enum: OptionGroupType,
    example: OptionGroupType.MULTIPLE,
  })
  @IsEnum(OptionGroupType, { message: ValidationMessages.IS_ENUM('O tipo do grupo') })
  type: OptionGroupType;

  @ApiPropertyOptional({
    description: 'Mínimo de unidades somadas no grupo. 0 = opcional, maior que 0 = obrigatório',
    minimum: 0,
    maximum: 999,
    default: 0,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('O mínimo') })
  @Min(0, { message: ValidationMessages.MIN('O mínimo', 0) })
  @Max(999, { message: ValidationMessages.MAX('O mínimo', 999) })
  min?: number;

  @ApiPropertyOptional({
    description: 'Máximo de unidades somadas no grupo. Sem valor = sem limite',
    minimum: 1,
    maximum: 999,
    example: 20,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O máximo') })
  @Min(1, { message: ValidationMessages.MIN('O máximo', 1) })
  @Max(999, { message: ValidationMessages.MAX('O máximo', 999) })
  max?: number | null;

  @ApiPropertyOptional({
    description: 'Máximo de unidades de uma mesma opção. Sem valor = sem limite',
    minimum: 1,
    maximum: 999,
    example: 10,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O máximo por opção') })
  @Min(1, { message: ValidationMessages.MIN('O máximo por opção', 1) })
  @Max(999, { message: ValidationMessages.MAX('O máximo por opção', 999) })
  maxPerOption?: number | null;

  @ApiPropertyOptional({ description: 'Opções do grupo', type: [CreateOptionDto] })
  @IsOptional()
  @IsArray({ message: ValidationMessages.IS_ARRAY('As opções') })
  @ArrayMaxSize(100, { message: ValidationMessages.ARRAY_MAX_SIZE('As opções', 100) })
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
