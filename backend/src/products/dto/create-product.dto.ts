import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Unit, ProductType } from 'generated/prisma/client';
import { CompositionItemDto } from './update-composition.dto';
import { Type } from 'class-transformer';
import { PreparationStepDto } from './update-preparation.dto';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    minLength: 3,
    maxLength: 200,
    example: 'Pizza Margherita',
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Nome deve ter no máximo 200 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Código único do produto (SKU/EAN/GTIN)',
    minLength: 1,
    maxLength: 50,
    example: 'PROD-001',
  })
  @IsString()
  @MinLength(1, { message: 'Código é obrigatório' })
  @MaxLength(50, { message: 'Código deve ter no máximo 50 caracteres' })
  code: string;

  @ApiPropertyOptional({
    description: 'Local de produção',
    example: 'Cozinha Principal',
  })
  @IsOptional()
  @IsString()
  productionLocation?: string;

  @ApiProperty({
    description: 'Preço de venda',
    minimum: 0,
    example: 45.9,
  })
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0, { message: 'Preço não pode ser negativo' })
  price: number;

  @ApiProperty({
    description: 'Custo do produto',
    minimum: 0,
    example: 25.0,
  })
  @IsNumber({}, { message: 'Custo deve ser um número' })
  @Min(0, { message: 'Custo não pode ser negativo' })
  costPrice: number;

  @ApiProperty({
    description: 'NCM (Nomenclatura Comum do Mercosul)',
    minLength: 8,
    maxLength: 8,
    example: '21069090',
  })
  @IsString()
  @Length(8, 8, { message: 'NCM deve ter exatamente 8 dígitos' })
  ncm: string;

  @ApiPropertyOptional({
    description: 'CEST (Código Especificador da Substituição Tributária)',
    minLength: 7,
    maxLength: 7,
    example: '1700100',
  })
  @IsOptional()
  @IsString()
  @Length(7, 7, { message: 'CEST deve ter exatamente 7 dígitos' })
  cest?: string;

  @ApiProperty({
    description: 'Origem da mercadoria (0-8)',
    minimum: 0,
    maximum: 8,
    example: 0,
  })
  @IsInt({ message: 'Origem deve ser um número inteiro' })
  @Min(0, { message: 'Origem deve ser entre 0 e 8' })
  origin: number;

  @ApiPropertyOptional({
    description: 'CSOSN (Código de Situação da Operação no Simples Nacional)',
    example: '102',
  })
  @IsOptional()
  @IsString()
  csosn?: string;

  @ApiPropertyOptional({
    description: 'CST ICMS (Código de Situação Tributária)',
    example: '00',
  })
  @IsOptional()
  @IsString()
  cst?: string;

  @ApiPropertyOptional({
    description: 'Alíquota ICMS',
    minimum: 0,
    example: 18.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota ICMS deve ser um número' })
  @Min(0, { message: 'Alíquota ICMS não pode ser negativa' })
  icmsRate?: number;

  @ApiPropertyOptional({
    description: 'CST PIS',
    example: '49',
  })
  @IsOptional()
  @IsString()
  cstPis?: string;

  @ApiPropertyOptional({
    description: 'Alíquota PIS',
    minimum: 0,
    example: 1.65,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota PIS deve ser um número' })
  @Min(0, { message: 'Alíquota PIS não pode ser negativa' })
  pisRate?: number;

  @ApiPropertyOptional({
    description: 'CST COFINS',
    example: '49',
  })
  @IsOptional()
  @IsString()
  cstCofins?: string;

  @ApiPropertyOptional({
    description: 'Alíquota COFINS',
    minimum: 0,
    example: 7.6,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota COFINS deve ser um número' })
  @Min(0, { message: 'Alíquota COFINS não pode ser negativa' })
  cofinsRate?: number;

  @ApiPropertyOptional({
    description: 'Percentual tributos federais',
    minimum: 0,
    example: 13.45,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota federal deve ser um número' })
  @Min(0, { message: 'Alíquota federal não pode ser negativa' })
  federalTaxRate?: number;

  @ApiPropertyOptional({
    description: 'Percentual tributos estaduais',
    minimum: 0,
    example: 18.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota estadual deve ser um número' })
  @Min(0, { message: 'Alíquota estadual não pode ser negativa' })
  stateTaxRate?: number;

  @ApiPropertyOptional({
    description: 'Percentual tributos municipais',
    minimum: 0,
    example: 5.0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Alíquota municipal deve ser um número' })
  @Min(0, { message: 'Alíquota municipal não pode ser negativa' })
  municipalTaxRate?: number;

  @ApiProperty({
    description: 'Unidade de medida',
    enum: Unit,
    example: 'UN',
  })
  @IsEnum(Unit, { message: 'Unidade de medida inválida' })
  unit: Unit;

  @ApiPropertyOptional({
    description: 'Quantidade em estoque',
    minimum: 0,
    example: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(0, { message: 'Quantidade não pode ser negativa' })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Estoque mínimo',
    minimum: 0,
    example: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque mínimo deve ser um número' })
  @Min(0, { message: 'Estoque mínimo não pode ser negativo' })
  minStock?: number;

  @ApiPropertyOptional({
    description: 'Status ativo/inativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active deve ser um valor booleano' })
  active?: boolean;

  @ApiProperty({
    description: 'Tipo do produto',
    enum: ProductType,
    example: 'MANUFACTURED',
  })
  @IsEnum(ProductType, { message: 'Tipo de produto inválido' })
  productType: ProductType;

  @ApiPropertyOptional({
    description: 'ID da categoria',
    example: null,
  })
  @IsOptional()
  @IsInt({ message: 'ID da categoria deve ser um número inteiro' })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Composição do produto (apenas para MANUFACTURED)',
    type: [CompositionItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompositionItemDto)
  composition?: CompositionItemDto[];

  @ApiPropertyOptional({
    description: 'Passos de preparo (apenas para MANUFACTURED)',
    type: [PreparationStepDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreparationStepDto)
  preparationSteps?: PreparationStepDto[];
}
