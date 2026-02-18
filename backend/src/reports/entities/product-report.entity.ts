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
  lastRestockDate: string | null;
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
