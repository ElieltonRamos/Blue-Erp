import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductType, Unit } from 'generated/prisma/client';
import { PaginationQueryDto } from 'src/common/utils/pagination-query.dto';
import {
  ValidationMessages,
  toBoolean,
  trim,
} from 'src/common/utils/validation';

export const PRODUCT_SORT_KEYS = [
  'id',
  'name',
  'code',
  'price',
  'costPrice',
  'quantity',
  'minStock',
  'productType',
  'active',
  'onlineSortOrder',
  'createdAt',
  'updatedAt',
] as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;

export class FilterProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'name',
    default: 'name',
    enum: PRODUCT_SORT_KEYS,
  })
  @IsOptional()
  @IsIn(PRODUCT_SORT_KEYS, {
    message: ValidationMessages.IS_ENUM('O campo de ordenação'),
  })
  sortKey?: (typeof PRODUCT_SORT_KEYS)[number];

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'asc',
    default: 'asc',
    enum: SORT_ORDERS,
  })
  @IsOptional()
  @IsIn(SORT_ORDERS, {
    message: ValidationMessages.IS_ENUM('A direção da ordenação'),
  })
  sortOrder?: (typeof SORT_ORDERS)[number];

  @ApiPropertyOptional({
    description: 'Busca por nome ou código',
    maxLength: 100,
    example: 'pizza',
  })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: ValidationMessages.IS_STRING('A busca') })
  @MaxLength(100, { message: ValidationMessages.MAX_LENGTH('A busca', 100) })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de produto',
    enum: ProductType,
  })
  @IsOptional()
  @IsEnum(ProductType, {
    message: ValidationMessages.IS_ENUM('O tipo do produto'),
  })
  productType?: ProductType;

  @ApiPropertyOptional({
    description: 'Filtrar por unidade de medida',
    enum: Unit,
  })
  @IsOptional()
  @IsEnum(Unit, { message: ValidationMessages.IS_ENUM('A unidade de medida') })
  unit?: Unit;

  @ApiPropertyOptional({
    description: 'Filtrar por status ativo/inativo',
    example: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('O status ativo') })
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas produtos com estoque baixo',
    example: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({
    message: ValidationMessages.IS_BOOLEAN('O filtro de estoque baixo'),
  })
  lowStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: ValidationMessages.IS_INT('A categoria') })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por visibilidade no cardápio online',
    example: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({
    message: ValidationMessages.IS_BOOLEAN('A visibilidade no cardápio online'),
  })
  onlineVisible?: boolean;
}
