export interface ProductSalesItem {
  productName: string;
  totalSold: number;
  revenue: number;
  averagePrice: number;
}

export interface RawMaterialUsage {
  materialName: string;
  totalUsed: number;
  unit: string;
  usageFrequency: number;
}

export interface RawMaterialExpiring {
  materialName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  currentStock: number;
  unit: string;
}

export interface StockLevel {
  itemName: string;
  currentStock: number;
  unit: string;
  type: 'product' | 'raw_material';
  lastRestockDate: string;
}

export interface PurchaseSuggestion {
  itemName: string;
  suggestedQuantity: number;
  unit: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProductReportSummary {
  topSellingProducts: ProductSalesItem[];
  mostUsedRawMaterials: RawMaterialUsage[];
  expiringRawMaterials: RawMaterialExpiring[];
  lowestStocks: StockLevel[];
  highestStocks: StockLevel[];
  purchaseSuggestions: PurchaseSuggestion[];
  totalProductsSold: number;
  totalRevenue: number;
}

export const productReportMock: ProductReportSummary = {
  topSellingProducts: [
    {
      productName: 'Produto A',
      totalSold: 150,
      revenue: 4500.0,
      averagePrice: 30.0,
    },
    {
      productName: 'Produto B',
      totalSold: 120,
      revenue: 3600.0,
      averagePrice: 30.0,
    },
  ],
  mostUsedRawMaterials: [
    {
      materialName: 'Farinha',
      totalUsed: 50.5,
      unit: 'kg',
      usageFrequency: 45,
    },
    {
      materialName: 'Açúcar',
      totalUsed: 30.2,
      unit: 'kg',
      usageFrequency: 38,
    },
  ],
  expiringRawMaterials: [
    {
      materialName: 'Leite',
      expiryDate: '2026-02-05',
      daysUntilExpiry: 8,
      currentStock: 10,
      unit: 'L',
    },
    {
      materialName: 'Ovos',
      expiryDate: '2026-02-10',
      daysUntilExpiry: 13,
      currentStock: 24,
      unit: 'unidades',
    },
  ],
  lowestStocks: [
    {
      itemName: 'Produto C',
      currentStock: 5,
      unit: 'unidades',
      type: 'product',
      lastRestockDate: '2026-01-20',
    },
    {
      itemName: 'Manteiga',
      currentStock: 2.5,
      unit: 'kg',
      type: 'raw_material',
      lastRestockDate: '2026-01-22',
    },
  ],
  highestStocks: [
    {
      itemName: 'Produto D',
      currentStock: 500,
      unit: 'unidades',
      type: 'product',
      lastRestockDate: '2026-01-15',
    },
    {
      itemName: 'Sal',
      currentStock: 100,
      unit: 'kg',
      type: 'raw_material',
      lastRestockDate: '2026-01-10',
    },
  ],
  purchaseSuggestions: [
    {
      itemName: 'Farinha',
      suggestedQuantity: 25,
      unit: 'kg',
      reason: 'Alto consumo no período',
      priority: 'high',
    },
    {
      itemName: 'Manteiga',
      suggestedQuantity: 10,
      unit: 'kg',
      reason: 'Estoque baixo',
      priority: 'high',
    },
    {
      itemName: 'Produto C',
      suggestedQuantity: 50,
      unit: 'unidades',
      reason: 'Estoque crítico',
      priority: 'medium',
    },
  ],
  totalProductsSold: 450,
  totalRevenue: 13500.0,
};