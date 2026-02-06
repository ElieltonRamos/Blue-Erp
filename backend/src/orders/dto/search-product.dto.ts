import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SearchProductDto {
  @ApiPropertyOptional({
    description: 'Buscar por código',
    example: 'PROD-001',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Buscar por nome', example: 'Filé' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Limite de resultados',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'ID do produto', example: 1 })
  id: number;

  @ApiProperty({ description: 'Código do produto', example: 'PROD-001' })
  code: string;

  @ApiProperty({ description: 'Nome do produto', example: 'Filé Mignon' })
  name: string;

  @ApiProperty({ description: 'Preço de venda', example: 45.0 })
  price: number;

  @ApiProperty({ description: 'Preço de custo', example: 30.0 })
  costPrice: number;

  @ApiProperty({ description: 'Unidade', example: 'UN' })
  unit: string;

  @ApiProperty({ description: 'Quantidade em estoque', example: 50 })
  quantity: number;

  @ApiProperty({ description: 'Produto ativo', example: true })
  active: boolean;

  @ApiProperty({ description: 'NCM', example: '02013000' })
  ncm: string;

  @ApiPropertyOptional({ description: 'CEST', example: '0100100' })
  cest?: string;

  @ApiProperty({ description: 'Origem (0-8)', example: 0 })
  origin: number;

  @ApiPropertyOptional({ description: 'CSOSN', example: '102' })
  csosn?: string;

  @ApiPropertyOptional({ description: 'CST ICMS', example: '00' })
  cst?: string;

  @ApiPropertyOptional({ description: 'CST PIS', example: '49' })
  cstPis?: string;

  @ApiPropertyOptional({ description: 'CST COFINS', example: '49' })
  cstCofins?: string;

  @ApiPropertyOptional({
    description: 'Alíquota tributos federais (%)',
    example: 13.45,
  })
  federalTaxRate?: number;

  @ApiPropertyOptional({
    description: 'Alíquota tributos estaduais (%)',
    example: 18.0,
  })
  stateTaxRate?: number;

  @ApiPropertyOptional({
    description: 'Alíquota tributos municipais (%)',
    example: 5.0,
  })
  municipalTaxRate?: number;

  @ApiPropertyOptional({
    description: 'Local de produção',
    example: 'cozinha-quente',
  })
  productionLocation?: string;

  @ApiPropertyOptional({ description: 'ID da categoria', example: 1 })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Categoria',
    example: { id: 1, name: 'Carnes' },
  })
  category?: {
    id: number;
    name: string;
  };
}
