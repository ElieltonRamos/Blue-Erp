import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ValidationMessages, notUndefined } from 'src/common/utils/validation';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas', description: 'Nome da categoria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'Se a categoria aparece no cardápio online' })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('A visibilidade no cardápio online') })
  onlineVisible?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0, maximum: 9999, description: 'Ordem de exibição no cardápio online' })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem de exibição') })
  @Min(0, { message: ValidationMessages.MIN('A ordem de exibição', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem de exibição', 9999) })
  onlineSortOrder?: number;
}
