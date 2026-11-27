import { ApiProperty } from '@nestjs/swagger';
import { Product, ProductType, Unit } from 'generated/prisma/client';

export class ProductResponseDto {
  @ApiProperty({ description: 'ID do produto', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do produto', example: 'Pizza Margherita' })
  name: string;

  @ApiProperty({ description: 'Código único do produto (SKU/EAN/GTIN)', example: 'PROD-001' })
  code: string;

  @ApiProperty({ description: 'Local de produção', example: 'Cozinha Principal', type: String, nullable: true })
  productionLocation: string | null;

  @ApiProperty({ description: 'Preço de venda', example: 45.9 })
  price: number;

  @ApiProperty({ description: 'Custo do produto', example: 25.0 })
  costPrice: number;

  @ApiProperty({ description: 'Custo extra', example: 2.5 })
  extraCosts: number;

  @ApiProperty({ description: 'NCM (Nomenclatura Comum do Mercosul)', example: '21069090' })
  ncm: string;

  @ApiProperty({
    description: 'CEST (Código Especificador da Substituição Tributária)',
    example: '1700100',
    type: String,
    nullable: true,
  })
  cest: string | null;

  @ApiProperty({ description: 'Origem da mercadoria (0-8)', example: 0 })
  origin: number;

  @ApiProperty({
    description: 'CSOSN (Código de Situação da Operação no Simples Nacional)',
    example: '102',
    type: String,
    nullable: true,
  })
  csosn: string | null;

  @ApiProperty({ description: 'CST ICMS (Código de Situação Tributária)', example: '00', type: String, nullable: true })
  cst: string | null;

  @ApiProperty({ description: 'Alíquota ICMS, em %', example: 18.0, type: Number, nullable: true })
  icmsRate: number | null;

  @ApiProperty({ description: 'CST PIS', example: '49', type: String, nullable: true })
  cstPis: string | null;

  @ApiProperty({ description: 'Alíquota PIS, em %', example: 1.65, type: Number, nullable: true })
  pisRate: number | null;

  @ApiProperty({ description: 'CST COFINS', example: '49', type: String, nullable: true })
  cstCofins: string | null;

  @ApiProperty({ description: 'Alíquota COFINS, em %', example: 7.6, type: Number, nullable: true })
  cofinsRate: number | null;

  @ApiProperty({ description: 'Percentual de tributos federais', example: 13.45, type: Number, nullable: true })
  federalTaxRate: number | null;

  @ApiProperty({ description: 'Percentual de tributos estaduais', example: 18.0, type: Number, nullable: true })
  stateTaxRate: number | null;

  @ApiProperty({ description: 'Percentual de tributos municipais', example: 5.0, type: Number, nullable: true })
  municipalTaxRate: number | null;

  @ApiProperty({ description: 'Unidade de medida', enum: Unit, example: 'UN' })
  unit: Unit;

  @ApiProperty({ description: 'Quantidade em estoque', example: 50 })
  quantity: number;

  @ApiProperty({ description: 'Estoque mínimo', example: 10, type: Number, nullable: true })
  minStock: number | null;

  @ApiProperty({ description: 'Status ativo/inativo', example: true })
  active: boolean;

  @ApiProperty({ description: 'Tipo do produto', enum: ProductType, example: 'MANUFACTURED' })
  productType: ProductType;

  @ApiProperty({ description: 'ID da categoria', example: 1, type: Number, nullable: true })
  categoryId: number | null;

  // ===== Cardápio online =====

  @ApiProperty({
    description: 'Descrição exibida no cardápio online',
    example: 'Molho de tomate, mussarela e manjericão',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Caminho relativo da imagem (servida pelo backend em /uploads)',
    example: '/uploads/products/3f2b8c1e-9d4a-4e7b-8a21-5c6d7e8f9a0b.webp',
    type: String,
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ description: 'Se aparece no carrossel de promoção do cardápio', example: false })
  featured: boolean;

  @ApiProperty({ description: 'Se aparece no cardápio online', example: false })
  onlineVisible: boolean;

  @ApiProperty({ description: 'Ordem de exibição no cardápio online', example: 0 })
  onlineSortOrder: number;

  @ApiProperty({ description: 'Preço promocional', example: 39.9, type: Number, nullable: true })
  promoPrice: number | null;

  @ApiProperty({ description: 'Início da promoção', example: '2026-12-01T03:00:00.000Z', type: Date, nullable: true })
  promoStartsAt: Date | null;

  @ApiProperty({ description: 'Fim da promoção', example: '2026-12-31T02:59:59.000Z', type: Date, nullable: true })
  promoEndsAt: Date | null;

  @ApiProperty({ description: 'Data de criação', example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização', example: '2024-01-20T14:45:00.000Z' })
  updatedAt: Date;

  constructor(product: Product) {
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
    this.description = product.description;
    this.imageUrl = product.imageUrl;
    this.featured = product.featured;
    this.onlineVisible = product.onlineVisible;
    this.onlineSortOrder = product.onlineSortOrder;
    this.promoPrice = product.promoPrice?.toNumber() ?? null;
    this.promoStartsAt = product.promoStartsAt;
    this.promoEndsAt = product.promoEndsAt;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
