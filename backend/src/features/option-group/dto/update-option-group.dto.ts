import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
import { CreateOptionDto, CreateOptionGroupDto } from './create-option-group.dto';

export class UpdateOptionDto extends CreateOptionDto {
  @ApiPropertyOptional({
    description: 'ID da opção existente no grupo. Sem ID, a opção é criada. Opção existente que não vier na lista é removida',
    example: 12,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O ID da opção') })
  id?: number;
}

// Colunas obrigatórias (não nulas) do banco: redeclaradas com ValidateIf para
// que null seja rejeitado na validação, e não vire erro 500 no Prisma.
// "options" também: null quebraria a comparação de opções no service.
export class UpdateOptionGroupDto extends PartialType(
  OmitType(CreateOptionGroupDto, ['name', 'type', 'min', 'options'] as const),
) {
  @ApiPropertyOptional({ description: 'Nome do grupo de opções', maxLength: 100, example: 'Adicionais' })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome do grupo') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O nome do grupo') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('O nome do grupo', 100) })
  name?: string;

  @ApiPropertyOptional({
    description: 'Tipo do grupo: SINGLE escolhe uma opção, MULTIPLE escolhe várias com quantidade',
    enum: OptionGroupType,
    example: OptionGroupType.MULTIPLE,
  })
  @ValidateIf(notUndefined)
  @IsEnum(OptionGroupType, { message: ValidationMessages.IS_ENUM('O tipo do grupo') })
  type?: OptionGroupType;

  @ApiPropertyOptional({
    description: 'Mínimo de unidades somadas no grupo. 0 = opcional, maior que 0 = obrigatório',
    minimum: 0,
    maximum: 999,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('O mínimo') })
  @Min(0, { message: ValidationMessages.MIN('O mínimo', 0) })
  @Max(999, { message: ValidationMessages.MAX('O mínimo', 999) })
  min?: number;

  @ApiPropertyOptional({
    description:
      'Lista completa das opções do grupo. Com ID atualiza, sem ID cria, e as que faltarem são removidas. Sem o campo, as opções não mudam',
    type: [UpdateOptionDto],
  })
  @ValidateIf(notUndefined)
  @IsArray({ message: ValidationMessages.IS_ARRAY('As opções') })
  @ArrayMaxSize(100, { message: ValidationMessages.ARRAY_MAX_SIZE('As opções', 100) })
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  options?: UpdateOptionDto[];
}
