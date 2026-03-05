import { ApiProperty } from '@nestjs/swagger';

export class ProductSalesItemDto {
  @ApiProperty({ description: 'Nome do produto', example: 'X-Burguer' })
  productName: string;

  /** Soma de saleItem.quantity no período */
  @ApiProperty({
    description: 'Quantidade total vendida no período',
    example: 120,
  })
  totalSold: number;

  /** Soma de saleItem.totalPrice no período */
  @ApiProperty({
    description: 'Receita bruta gerada pelo produto no período',
    example: 1800.0,
    type: 'number',
  })
  revenue: number;

  /** revenue / totalSold */
  @ApiProperty({
    description: 'Ticket médio por unidade vendida',
    example: 15.0,
    type: 'number',
  })
  averagePrice: number;
}

export class RawMaterialUsageDto {
  @ApiProperty({
    description: 'Nome da matéria-prima',
    example: 'Farinha de trigo',
  })
  materialName: string;

  /** Σ (compositionItem.quantity × saleItem.quantity) */
  @ApiProperty({
    description:
      'Quantidade teórica consumida no período (ficha técnica × vendas)',
    example: 50.5,
    type: 'number',
  })
  totalUsed: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'KG' })
  unit: string;

  /** Número de sales distintas onde o material apareceu */
  @ApiProperty({
    description: 'Em quantas vendas distintas o material foi utilizado',
    example: 30,
  })
  usageFrequency: number;

  /** primaryMaterial.unitCost */
  @ApiProperty({
    description: 'Custo unitário cadastrado da matéria-prima',
    example: 3.5,
    type: 'number',
  })
  unitCost: number;

  /** totalUsed × unitCost */
  @ApiProperty({
    description:
      'Custo total teórico consumido no período (totalUsed × unitCost)',
    example: 176.75,
    type: 'number',
  })
  totalCost: number;
}

export class RawMaterialExpiringDto {
  @ApiProperty({
    description: 'Nome da matéria-prima',
    example: 'Leite integral',
  })
  materialName: string;

  @ApiProperty({
    description: 'Data de validade (ISO 8601)',
    example: '2024-02-15T00:00:00.000Z',
  })
  expiryDate: string;

  @ApiProperty({ description: 'Dias restantes até o vencimento', example: 7 })
  daysUntilExpiry: number;

  @ApiProperty({
    description: 'Quantidade atual em estoque',
    example: 10.5,
    type: 'number',
  })
  currentStock: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'LT' })
  unit: string;
}

export class StockLevelDto {
  @ApiProperty({
    description: 'Nome do item (produto ou matéria-prima)',
    example: 'X-Burguer',
  })
  itemName: string;

  @ApiProperty({
    description: 'Quantidade atual em estoque',
    example: 5.0,
    type: 'number',
  })
  currentStock: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'UN' })
  unit: string;

  @ApiProperty({
    description: 'Origem do item',
    enum: ['product', 'raw_material'],
  })
  type: 'product' | 'raw_material';

  @ApiProperty({
    description: 'Data da última reposição (não implementado — sempre null)',
    example: null,
    nullable: true,
    type: String,
  })
  lastRestockDate: string | null;
}

export class PurchaseSuggestionDto {
  @ApiProperty({
    description: 'Nome do item (produto ou matéria-prima)',
    example: 'Farinha de trigo',
  })
  itemName: string;

  /** deficit × 1.5 — déficit com margem de segurança */
  @ApiProperty({
    description: 'Quantidade sugerida para compra (déficit × 1.5)',
    example: 20,
    type: 'number',
  })
  suggestedQuantity: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'KG' })
  unit: string;

  @ApiProperty({
    description: 'Motivo da sugestão de compra',
    example: 'Estoque atual (2) abaixo do mínimo (10)',
  })
  reason: string;

  @ApiProperty({
    description:
      'Prioridade: high = zerado ou < 50% do mínimo; medium = entre 50% e 100%',
    enum: ['high', 'medium', 'low'],
  })
  priority: 'high' | 'medium' | 'low';

  /**
   * Matéria-prima  → primaryMaterial.unitCost
   * Produto RESALE → product.costPrice
   * Produto MANUFACTURED/SEMI_MANUFACTURED → product.costPrice (custo cadastrado)
   */
  @ApiProperty({
    description: 'Custo unitário de referência para reposição',
    example: 3.5,
    type: 'number',
  })
  unitCost: number;

  /** suggestedQuantity × unitCost */
  @ApiProperty({
    description:
      'Custo estimado para repor este item (suggestedQuantity × unitCost)',
    example: 70.0,
    type: 'number',
  })
  replenishmentCost: number;
}

export class ProductReportSummaryDto {
  @ApiProperty({
    description: 'Top 10 produtos mais vendidos no período',
    type: [ProductSalesItemDto],
  })
  topSellingProducts: ProductSalesItemDto[];

  @ApiProperty({
    description:
      'Top 10 matérias-primas mais consumidas no período (cruzamento ficha técnica × vendas)',
    type: [RawMaterialUsageDto],
  })
  mostUsedRawMaterials: RawMaterialUsageDto[];

  @ApiProperty({
    description: 'Matérias-primas com vencimento nos próximos 30 dias',
    type: [RawMaterialExpiringDto],
  })
  expiringRawMaterials: RawMaterialExpiringDto[];

  @ApiProperty({
    description:
      'Itens com menor quantidade em estoque (produtos + matérias-primas)',
    type: [StockLevelDto],
  })
  lowestStocks: StockLevelDto[];

  @ApiProperty({
    description:
      'Itens com maior quantidade em estoque (produtos + matérias-primas)',
    type: [StockLevelDto],
  })
  highestStocks: StockLevelDto[];

  @ApiProperty({
    description:
      'Itens com estoque abaixo do mínimo cadastrado, ordenados por prioridade',
    type: [PurchaseSuggestionDto],
  })
  purchaseSuggestions: PurchaseSuggestionDto[];

  /** Σ saleItem.quantity no período (composesTotal = 1) */
  @ApiProperty({
    description: 'Total de unidades vendidas no período',
    example: 350,
  })
  totalProductsSold: number;

  /** Σ saleItem.totalPrice no período (composesTotal = 1) */
  @ApiProperty({
    description: 'Receita bruta total do período',
    example: 12500.75,
    type: 'number',
  })
  totalRevenue: number;

  /** Σ RawMaterialUsageDto.totalCost — custo teórico de MP consumida */
  @ApiProperty({
    description:
      'CMV de matéria-prima: custo total teórico consumido no período (baseado em ficha técnica × vendas × unitCost)',
    example: 4200.0,
    type: 'number',
  })
  grandTotalConsumedCost: number;

  /** Σ PurchaseSuggestionDto.replenishmentCost */
  @ApiProperty({
    description:
      'Custo total estimado para repor todos os itens abaixo do estoque mínimo',
    example: 1850.0,
    type: 'number',
  })
  totalReplenishmentCost: number;
}

export class ProductReportResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['OK', 'ERROR'],
    example: 'OK',
  })
  status: 'OK' | 'ERROR';

  @ApiProperty({
    description: 'Dados do relatório',
    type: ProductReportSummaryDto,
    required: false,
  })
  data?: ProductReportSummaryDto;

  @ApiProperty({
    description: 'Mensagem de erro quando status for ERROR',
    required: false,
  })
  message?: string;
}
