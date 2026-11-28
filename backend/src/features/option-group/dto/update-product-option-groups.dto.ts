import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ValidationMessages, notUndefined } from 'src/common/utils/validation';

export class ProductOptionGroupItemDto {
  @ApiProperty({ description: 'ID do grupo de opções a vincular ao produto', example: 1 })
  @IsInt({ message: ValidationMessages.IS_INT('O grupo de opções') })
  groupId: number;

  @ApiPropertyOptional({
    description: 'Ordem de exibição do grupo no produto. Sem valor, usa a posição na lista',
    minimum: 0,
    maximum: 9999,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem do grupo') })
  @Min(0, { message: ValidationMessages.MIN('A ordem do grupo', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem do grupo', 9999) })
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Mínimo de unidades somadas neste produto. Sem valor, usa o do grupo',
    minimum: 0,
    maximum: 999,
    example: 1,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O mínimo') })
  @Min(0, { message: ValidationMessages.MIN('O mínimo', 0) })
  @Max(999, { message: ValidationMessages.MAX('O mínimo', 999) })
  minOverride?: number | null;

  @ApiPropertyOptional({
    description: 'Máximo de unidades somadas neste produto. Sem valor, usa o do grupo',
    minimum: 1,
    maximum: 999,
    example: 5,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O máximo') })
  @Min(1, { message: ValidationMessages.MIN('O máximo', 1) })
  @Max(999, { message: ValidationMessages.MAX('O máximo', 999) })
  maxOverride?: number | null;

  @ApiPropertyOptional({
    description: 'Máximo de unidades de uma mesma opção neste produto. Sem valor, usa o do grupo',
    minimum: 1,
    maximum: 999,
    example: 2,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('O máximo por opção') })
  @Min(1, { message: ValidationMessages.MIN('O máximo por opção', 1) })
  @Max(999, { message: ValidationMessages.MAX('O máximo por opção', 999) })
  maxPerOptionOverride?: number | null;
}

export class UpdateProductOptionGroupsDto {
  @ApiProperty({
    description:
      'Lista completa dos grupos do produto. A ordem da lista é a ordem de exibição. Grupo que faltar é desvinculado. Lista vazia desvincula todos',
    type: [ProductOptionGroupItemDto],
  })
  @IsArray({ message: ValidationMessages.IS_ARRAY('Os grupos de opções') })
  @ArrayMaxSize(50, { message: ValidationMessages.ARRAY_MAX_SIZE('Os grupos de opções', 50) })
  @ValidateNested({ each: true })
  @Type(() => ProductOptionGroupItemDto)
  groups: ProductOptionGroupItemDto[];
}
