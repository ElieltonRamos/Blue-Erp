import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, Unit } from 'generated/prisma/client';
import { ValidationMessages, digits, digitsOrNull, notUndefined, trim, trimOrNull } from 'src/common/utils/validation';
import { CompositionItemDto } from './update-composition.dto';
import { PreparationStepDto } from './update-preparation.dto';

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto', minLength: 3, maxLength: 200, example: 'Pizza Margherita' })
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O nome') })
  @MinLength(3, { message: ValidationMessages.MIN_LENGTH('O nome', 3) })
  @MaxLength(200, { message: ValidationMessages.MAX_LENGTH('O nome', 200) })
  name: string;

  @ApiProperty({ description: 'Código único do produto (SKU/EAN/GTIN)', maxLength: 50, example: 'PROD-001' })
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('O código') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_BLANK('O código') })
  @MaxLength(50, { message: ValidationMessages.MAX_LENGTH('O código', 50) })
  code: string;

  @ApiPropertyOptional({ description: 'Local de produção', example: 'Cozinha Principal', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O local de produção') })
  productionLocation?: string | null;

  @ApiProperty({ description: 'Preço de venda', minimum: 0, example: 45.9 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O preço', 2) })
  @Min(0, { message: ValidationMessages.MIN('O preço', 0) })
  price: number;

  @ApiProperty({ description: 'Custo do produto', minimum: 0, example: 25.0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O custo', 2) })
  @Min(0, { message: ValidationMessages.MIN('O custo', 0) })
  costPrice: number;

  @ApiProperty({ description: 'Custo extra', minimum: 0, example: 2.5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O custo extra', 2) })
  @Min(0, { message: ValidationMessages.MIN('O custo extra', 0) })
  extraCosts: number;

  @ApiProperty({ description: 'NCM (Nomenclatura Comum do Mercosul). Somente dígitos', example: '21069090' })
  @Transform(digits)
  @IsString({ message: ValidationMessages.IS_STRING('O NCM') })
  @Length(8, 8, { message: ValidationMessages.EXACT_DIGITS('O NCM', 8) })
  ncm: string;

  @ApiPropertyOptional({
    description: 'CEST (Código Especificador da Substituição Tributária)',
    example: '1700100',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Transform(digitsOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O CEST') })
  @Length(7, 7, { message: ValidationMessages.EXACT_DIGITS('O CEST', 7) })
  cest?: string | null;

  @ApiProperty({ description: 'Origem da mercadoria (0-8)', minimum: 0, maximum: 8, example: 0 })
  @IsInt({ message: ValidationMessages.IS_INT('A origem') })
  @Min(0, { message: ValidationMessages.MIN('A origem', 0) })
  @Max(8, { message: ValidationMessages.MAX('A origem', 8) })
  origin: number;

  @ApiPropertyOptional({
    description: 'CSOSN (Código de Situação da Operação no Simples Nacional)',
    example: '102',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O CSOSN') })
  csosn?: string | null;

  @ApiPropertyOptional({ description: 'CST ICMS (Código de Situação Tributária)', example: '00', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O CST do ICMS') })
  cst?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota ICMS, em %',
    minimum: 0,
    maximum: 100,
    example: 18.0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota de ICMS', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota de ICMS', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota de ICMS', 100) })
  icmsRate?: number | null;

  @ApiPropertyOptional({ description: 'CST PIS', example: '49', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O CST do PIS') })
  cstPis?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota PIS, em %',
    minimum: 0,
    maximum: 100,
    example: 1.65,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota de PIS', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota de PIS', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota de PIS', 100) })
  pisRate?: number | null;

  @ApiPropertyOptional({ description: 'CST COFINS', example: '49', type: String, nullable: true })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('O CST do COFINS') })
  cstCofins?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota COFINS, em %',
    minimum: 0,
    maximum: 100,
    example: 7.6,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota de COFINS', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota de COFINS', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota de COFINS', 100) })
  cofinsRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual de tributos federais',
    minimum: 0,
    maximum: 100,
    example: 13.45,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota federal', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota federal', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota federal', 100) })
  federalTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual de tributos estaduais',
    minimum: 0,
    maximum: 100,
    example: 18.0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota estadual', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota estadual', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota estadual', 100) })
  stateTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual de tributos municipais',
    minimum: 0,
    maximum: 100,
    example: 5.0,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('A alíquota municipal', 2) })
  @Min(0, { message: ValidationMessages.MIN('A alíquota municipal', 0) })
  @Max(100, { message: ValidationMessages.MAX('A alíquota municipal', 100) })
  municipalTaxRate?: number | null;

  @ApiProperty({ description: 'Unidade de medida', enum: Unit, example: 'UN' })
  @IsEnum(Unit, { message: ValidationMessages.IS_ENUM('A unidade de medida') })
  unit: Unit;

  @ApiPropertyOptional({ description: 'Quantidade em estoque', minimum: 0, default: 0, example: 50 })
  @ValidateIf(notUndefined)
  @IsNumber({ maxDecimalPlaces: 3 }, { message: ValidationMessages.IS_DECIMAL('A quantidade', 3) })
  @Min(0, { message: ValidationMessages.MIN('A quantidade', 0) })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Estoque mínimo', minimum: 0, example: 10, type: Number, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 }, { message: ValidationMessages.IS_DECIMAL('O estoque mínimo', 3) })
  @Min(0, { message: ValidationMessages.MIN('O estoque mínimo', 0) })
  minStock?: number | null;

  @ApiPropertyOptional({ description: 'Status ativo/inativo', default: true, example: true })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O status ativo') })
  active?: boolean;

  @ApiProperty({ description: 'Tipo do produto', enum: ProductType, example: 'MANUFACTURED' })
  @IsEnum(ProductType, { message: ValidationMessages.IS_ENUM('O tipo do produto') })
  productType: ProductType;

  @ApiPropertyOptional({ description: 'ID da categoria', example: 1, type: Number, nullable: true })
  @IsOptional()
  @IsInt({ message: ValidationMessages.IS_INT('A categoria') })
  categoryId?: number | null;

  // ===== Cardápio online =====

  @ApiPropertyOptional({
    description: 'Descrição exibida no cardápio online',
    maxLength: 1000,
    example: 'Molho de tomate, mussarela e manjericão',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString({ message: ValidationMessages.IS_STRING('A descrição') })
  @MaxLength(1000, { message: ValidationMessages.MAX_LENGTH('A descrição', 1000) })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Se o produto aparece no carrossel de promoção do cardápio',
    default: false,
    example: false,
  })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O destaque') })
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Se o produto aparece no cardápio online', default: false, example: false })
  @ValidateIf(notUndefined)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('A visibilidade no cardápio online') })
  onlineVisible?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição no cardápio online', minimum: 0, maximum: 9999, default: 0, example: 0 })
  @ValidateIf(notUndefined)
  @IsInt({ message: ValidationMessages.IS_INT('A ordem de exibição') })
  @Min(0, { message: ValidationMessages.MIN('A ordem de exibição', 0) })
  @Max(9999, { message: ValidationMessages.MAX('A ordem de exibição', 9999) })
  onlineSortOrder?: number;

  @ApiPropertyOptional({
    description: 'Preço promocional. Exige início e fim da promoção',
    minimum: 0,
    example: 39.9,
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: ValidationMessages.IS_DECIMAL('O preço promocional', 2) })
  @Min(0, { message: ValidationMessages.MIN('O preço promocional', 0) })
  promoPrice?: number | null;

  @ApiPropertyOptional({
    description: 'Início da promoção (ISO 8601, com fuso -03:00)',
    example: '2026-12-01T00:00:00-03:00',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Transform(trimOrNull)
  @IsDateString({}, { message: ValidationMessages.IS_DATE('O início da promoção') })
  promoStartsAt?: string | null;

  @ApiPropertyOptional({
    description: 'Fim da promoção (ISO 8601, com fuso -03:00)',
    example: '2026-12-31T23:59:59-03:00',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @Transform(trimOrNull)
  @IsDateString({}, { message: ValidationMessages.IS_DATE('O fim da promoção') })
  promoEndsAt?: string | null;

  // ===== Composição e preparo =====

  @ApiPropertyOptional({ description: 'Composição do produto (apenas para MANUFACTURED)', type: [CompositionItemDto] })
  @IsOptional()
  @IsArray({ message: ValidationMessages.IS_ARRAY('A composição') })
  @ValidateNested({ each: true })
  @Type(() => CompositionItemDto)
  composition?: CompositionItemDto[];

  @ApiPropertyOptional({ description: 'Passos de preparo (apenas para MANUFACTURED)', type: [PreparationStepDto] })
  @IsOptional()
  @IsArray({ message: ValidationMessages.IS_ARRAY('Os passos de preparo') })
  @ValidateNested({ each: true })
  @Type(() => PreparationStepDto)
  preparationSteps?: PreparationStepDto[];
}
