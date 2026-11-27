import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ProductType, Unit } from 'generated/prisma/client';
import {
  ValidationMessages,
  digits,
  notUndefined,
  trim,
} from 'src/common/utils/validation';
import { CreateProductDto } from './create-product.dto';

// Colunas obrigatórias (não nulas) do banco: redeclaradas com ValidateIf para
// que null seja rejeitado na validação, e não vire erro 500 no Prisma.
const REQUIRED_COLUMNS = [
  'name',
  'code',
  'price',
  'costPrice',
  'extraCosts',
  'ncm',
  'origin',
  'unit',
  'quantity',
  'active',
  'productType',
  'featured',
  'onlineVisible',
  'onlineSortOrder',
  'composition',
  'preparationSteps',
] as const;

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, REQUIRED_COLUMNS),
) {
  @ApiPropertyOptional({
    description: 'Nome do produto',
    minLength: 3,
    maxLength: 200,
    example: 'Pizza Margherita',
  })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome') })
  @MinLength(3, { message: ValidationMessages.MIN_LENGTH('O nome', 3) })
  @MaxLength(200, { message: ValidationMessages.MAX_LENGTH('O nome', 200) })
  name?: string;

  @ApiPropertyOptional({
    description: 'Código único do produto (SKU/EAN/GTIN)',
    maxLength: 50,
    example: 'PROD-001',
  })
  @ValidateIf(notUndefined)
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O código') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O código') })
  @MaxLength(50, { message: ValidationMessages.MAX_LENGTH('O código', 50) })
  code?: string;

  @ApiPropertyOptional({
    description: 'Preço de venda',
    minimum: 0,
    example: 45.9,
  })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: ValidationMessages.IS_DECIMAL('O preço', 2) },
  )
  @Min(0, { message: ValidationMessages.MIN('O preço', 0) })
  price?: number;

  @ApiPropertyOptional({
    description: 'Custo do produto',
    minimum: 0,
    example: 25.0,
  })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: ValidationMessages.IS_DECIMAL('O custo', 2) },
  )
  @Min(0, { message: ValidationMessages.MIN('O custo', 0) })
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Custo extra',
    minimum: 0,
    example: 2.5,
  })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: ValidationMessages.IS_DECIMAL('O custo extra', 2) },
  )
  @Min(0, { message: ValidationMessages.MIN('O custo extra', 0) })
  extraCosts?: number;

  @ApiPropertyOptional({
    description: 'NCM (Nomenclatura Comum do Mercosul). Somente dígitos',
    example: '21069090',
  })
  @ValidateIf(notUndefined)
  @Transform(digits)
  @IsString({ message: ValidationMessages.IS_STRING('O NCM') })
  @Length(8, 8, { message: ValidationMessages.EXACT_DIGITS('O NCM', 8) })
  ncm?: string;

  @ApiPropertyOptional({
    description: 'Origem da mercadoria (0-8)',
    minimum: 0,
    maximum: 8,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A origem') })
  @Min(0, { message: ValidationMessages.MIN('A origem', 0) })
  @Max(8, { message: ValidationMessages.MAX('A origem', 8) })
  origin?: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
    enum: Unit,
    example: 'UN',
  })
  @ValidateIf(notUndefined)
  @IsEnum(Unit, { message: ValidationMessages.IS_ENUM('A unidade de medida') })
  unit?: Unit;

  @ApiPropertyOptional({
    description: 'Quantidade em estoque',
    minimum: 0,
    example: 50,
  })
  @ValidateIf(notUndefined)
  @IsNumber(
    { maxDecimalPlaces: 3 },
    { message: ValidationMessages.IS_DECIMAL('A quantidade', 3) },
  )
  @Min(0, { message: ValidationMessages.MIN('A quantidade', 0) })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Status ativo/inativo', example: true })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O status ativo') })
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo do produto',
    enum: ProductType,
    example: 'MANUFACTURED',
  })
  @ValidateIf(notUndefined)
  @IsEnum(ProductType, {
    message: ValidationMessages.IS_ENUM('O tipo do produto'),
  })
  productType?: ProductType;

  @ApiPropertyOptional({
    description: 'Se o produto aparece no carrossel de promoção do cardápio',
    example: false,
  })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O destaque') })
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Se o produto aparece no cardápio online',
    example: false,
  })
  @ValidateIf(notUndefined)
  @IsBoolean({
    message: ValidationMessages.IS_BOOLEAN('A visibilidade no cardápio online'),
  })
  onlineVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Ordem de exibição no cardápio online',
    minimum: 0,
    maximum: 9999,
    example: 0,
  })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem de exibição') })
  @Min(0, { message: ValidationMessages.MIN('A ordem de exibição', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem de exibição', 9999) })
  onlineSortOrder?: number;
}
