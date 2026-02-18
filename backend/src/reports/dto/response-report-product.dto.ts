import { ApiProperty } from '@nestjs/swagger';

export class ProductSalesItemDto {
  @ApiProperty({ description: 'Nome do produto', example: 'X-Burguer' })
  productName: string;

  @ApiProperty({ description: 'Quantidade total vendida', example: 120 })
  totalSold: number;

  @ApiProperty({
    description: 'Receita total gerada pelo produto',
    example: 1800.0,
    type: 'number',
  })
  revenue: number;

  @ApiProperty({
    description: 'Preço médio de venda',
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

  @ApiProperty({
    description: 'Quantidade total consumida no período',
    example: 50.5,
    type: 'number',
  })
  totalUsed: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'KG' })
  unit: string;

  @ApiProperty({
    description: 'Quantidade de vendas distintas que utilizaram este material',
    example: 30,
  })
  usageFrequency: number;
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

  @ApiProperty({ description: 'Estoque atual', example: 10.5, type: 'number' })
  currentStock: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'LT' })
  unit: string;
}

export class StockLevelDto {
  @ApiProperty({ description: 'Nome do item', example: 'X-Burguer' })
  itemName: string;

  @ApiProperty({ description: 'Estoque atual', example: 5.0, type: 'number' })
  currentStock: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'UN' })
  unit: string;

  @ApiProperty({
    description: 'Tipo do item',
    enum: ['product', 'raw_material'],
  })
  type: 'product' | 'raw_material';

  @ApiProperty({
    description: 'Data da última reposição',
    example: null,
    nullable: true,
    type: String,
  })
  lastRestockDate: string | null;
}

export class PurchaseSuggestionDto {
  @ApiProperty({ description: 'Nome do item', example: 'Farinha de trigo' })
  itemName: string;

  @ApiProperty({
    description: 'Quantidade sugerida para compra',
    example: 20,
    type: 'number',
  })
  suggestedQuantity: number;

  @ApiProperty({ description: 'Unidade de medida', example: 'KG' })
  unit: string;

  @ApiProperty({
    description: 'Motivo da sugestão',
    example: 'Estoque abaixo do mínimo',
  })
  reason: string;

  @ApiProperty({
    description: 'Prioridade da compra',
    enum: ['high', 'medium', 'low'],
  })
  priority: 'high' | 'medium' | 'low';
}

export class ProductReportSummaryDto {
  @ApiProperty({
    description: 'Produtos mais vendidos no período',
    type: [ProductSalesItemDto],
  })
  topSellingProducts: ProductSalesItemDto[];

  @ApiProperty({
    description: 'Matérias-primas mais utilizadas no período',
    type: [RawMaterialUsageDto],
  })
  mostUsedRawMaterials: RawMaterialUsageDto[];

  @ApiProperty({
    description: 'Matérias-primas próximas do vencimento (30 dias)',
    type: [RawMaterialExpiringDto],
  })
  expiringRawMaterials: RawMaterialExpiringDto[];

  @ApiProperty({
    description: 'Itens com menor estoque',
    type: [StockLevelDto],
  })
  lowestStocks: StockLevelDto[];

  @ApiProperty({
    description: 'Itens com maior estoque',
    type: [StockLevelDto],
  })
  highestStocks: StockLevelDto[];

  @ApiProperty({
    description: 'Sugestões de compra baseadas no estoque mínimo',
    type: [PurchaseSuggestionDto],
  })
  purchaseSuggestions: PurchaseSuggestionDto[];

  @ApiProperty({
    description: 'Total de unidades vendidas no período',
    example: 350,
  })
  totalProductsSold: number;

  @ApiProperty({
    description: 'Receita total do período',
    example: 12500.75,
    type: 'number',
  })
  totalRevenue: number;
}

export class ProductReportResponseDto {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['OK', 'ERROR'],
    example: 'OK',
  })
  status: 'OK' | 'ERROR';

  @ApiProperty({
    description: 'Dados do relatório de produtos',
    type: ProductReportSummaryDto,
    required: false,
  })
  data?: ProductReportSummaryDto;

  @ApiProperty({
    description: 'Mensagem de erro quando status for ERROR',
    example: 'Erro interno do servidor ao gerar relatório',
    required: false,
  })
  message?: string;
}
