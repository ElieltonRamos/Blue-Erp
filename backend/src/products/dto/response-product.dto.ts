import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/client';
import { Unit, ProductType } from 'generated/prisma/client';

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID do produto',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Pizza Margherita',
  })
  name: string;

  @ApiProperty({
    description: 'Código único do produto (SKU/EAN/GTIN)',
    example: 'PROD-001',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Local de produção',
    example: 'Cozinha Principal',
    nullable: true,
  })
  productionLocation?: string | null;

  @ApiProperty({
    description: 'Preço de venda',
    example: 45.9,
  })
  price: number;

  @ApiProperty({
    description: 'Custo Extra',
    example: 45.9,
  })
  extraCosts: number;

  @ApiProperty({
    description: 'Custo do produto',
    example: 25.0,
  })
  costPrice: number;

  @ApiProperty({
    description: 'NCM (Nomenclatura Comum do Mercosul)',
    example: '21069090',
  })
  ncm: string;

  @ApiPropertyOptional({
    description: 'CEST (Código Especificador da Substituição Tributária)',
    example: '1700100',
    nullable: true,
  })
  cest?: string | null;

  @ApiProperty({
    description: 'Origem da mercadoria (0-8)',
    example: 0,
  })
  origin: number;

  @ApiPropertyOptional({
    description: 'CSOSN (Código de Situação da Operação no Simples Nacional)',
    example: '102',
    nullable: true,
  })
  csosn?: string | null;

  @ApiPropertyOptional({
    description: 'CST ICMS (Código de Situação Tributária)',
    example: '00',
    nullable: true,
  })
  cst?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota ICMS',
    example: 18.0,
    nullable: true,
  })
  icmsRate?: number | null;

  @ApiPropertyOptional({
    description: 'CST PIS',
    example: '49',
    nullable: true,
  })
  cstPis?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota PIS',
    example: 1.65,
    nullable: true,
  })
  pisRate?: number | null;

  @ApiPropertyOptional({
    description: 'CST COFINS',
    example: '49',
    nullable: true,
  })
  cstCofins?: string | null;

  @ApiPropertyOptional({
    description: 'Alíquota COFINS',
    example: 7.6,
    nullable: true,
  })
  cofinsRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual tributos federais',
    example: 13.45,
    nullable: true,
  })
  federalTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual tributos estaduais',
    example: 18.0,
    nullable: true,
  })
  stateTaxRate?: number | null;

  @ApiPropertyOptional({
    description: 'Percentual tributos municipais',
    example: 5.0,
    nullable: true,
  })
  municipalTaxRate?: number | null;

  @ApiProperty({
    description: 'Unidade de medida',
    enum: Unit,
    example: 'UN',
  })
  unit: Unit;

  @ApiProperty({
    description: 'Quantidade em estoque',
    example: 50,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Estoque mínimo',
    example: 10,
    nullable: true,
  })
  minStock?: number | null;

  @ApiProperty({
    description: 'Status ativo/inativo',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Tipo do produto',
    enum: ProductType,
    example: 'MANUFACTURED',
  })
  productType: ProductType;

  @ApiPropertyOptional({
    description: 'ID da categoria',
    example: 1,
    nullable: true,
  })
  categoryId?: number | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-20T14:45:00.000Z',
  })
  updatedAt: Date;

  constructor(product: {
    id: number;
    name: string;
    code: string;
    productionLocation: string | null;
    price: Decimal;
    costPrice: Decimal;
    extraCosts: Decimal;
    ncm: string;
    cest: string | null;
    origin: number;
    csosn: string | null;
    cst: string | null;
    icmsRate: Decimal | null;
    cstPis: string | null;
    pisRate: Decimal | null;
    cstCofins: string | null;
    cofinsRate: Decimal | null;
    federalTaxRate: Decimal | null;
    stateTaxRate: Decimal | null;
    municipalTaxRate: Decimal | null;
    unit: Unit;
    quantity: Decimal;
    minStock: Decimal | null;
    active: boolean;
    productType: ProductType;
    categoryId: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = product.id;
    this.name = product.name;
    this.code = product.code;
    this.productionLocation = product.productionLocation;
    this.price = product.price.toNumber();
    this.costPrice = product.costPrice.toNumber();
    this.extraCosts = product.extraCosts.toNumber();
    this.ncm = product.ncm;
    this.cest = product.cest;
    this.origin = product.origin;
    this.csosn = product.csosn;
    this.cst = product.cst;
    this.icmsRate = product.icmsRate?.toNumber() ?? null;
    this.cstPis = product.cstPis;
    this.pisRate = product.pisRate?.toNumber() ?? null;
    this.cstCofins = product.cstCofins;
    this.cofinsRate = product.cofinsRate?.toNumber() ?? null;
    this.federalTaxRate = product.federalTaxRate?.toNumber() ?? null;
    this.stateTaxRate = product.stateTaxRate?.toNumber() ?? null;
    this.municipalTaxRate = product.municipalTaxRate?.toNumber() ?? null;
    this.unit = product.unit;
    this.quantity = product.quantity.toNumber();
    this.minStock = product.minStock?.toNumber() ?? null;
    this.active = product.active;
    this.productType = product.productType;
    this.categoryId = product.categoryId;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
