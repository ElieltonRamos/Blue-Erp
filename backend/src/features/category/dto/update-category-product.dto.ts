import { OmitType, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { ValidationMessages, notUndefined } from 'src/common/utils/validation';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['onlineVisible', 'onlineSortOrder'] as const),
) {
  @ApiPropertyOptional({
    example: true,
    description: 'Se a categoria aparece no cardápio online',
  })
  @ValidateIf(notUndefined)
  @IsBoolean({
    message: ValidationMessages.IS_BOOLEAN('A visibilidade no cardápio online'),
  })
  onlineVisible?: boolean;

  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
    maximum: 9999,
    description: 'Ordem de exibição no cardápio online',
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem de exibição') })
  @Min(0, { message: ValidationMessages.MIN('A ordem de exibição', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem de exibição', 9999) })
  onlineSortOrder?: number;
}
