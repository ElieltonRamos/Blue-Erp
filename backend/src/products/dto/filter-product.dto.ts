import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Unit, ProductType } from 'generated/prisma/client';

export class FilterProductDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'name',
    enum: [
      'id',
      'name',
      'code',
      'price',
      'costPrice',
      'quantity',
      'minStock',
      'productType',
      'active',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsString()
  sortKey?: string;

  @ApiPropertyOptional({
    description: 'Ordem de classificação',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Busca por nome ou código',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de produto',
    enum: ProductType,
  })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({
    description: 'Filtrar por unidade de medida',
    enum: Unit,
  })
  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;

  @ApiPropertyOptional({
    description: 'Filtrar por status ativo/inativo',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar apenas produtos com estoque baixo',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por categoria',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
