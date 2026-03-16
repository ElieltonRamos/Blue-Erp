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
  unitCost: number;
  totalCost: number;
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
  unitCost: number;
  replenishmentCost: number;
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
  grandTotalConsumedCost: number;
  totalReplenishmentCost: number;
  totalStockValue: number;
}

export interface ProductReport {
  status: string;
  data: ProductReportSummary;
}

export const productReportMock: ProductReportSummary = {
  topSellingProducts: [],
  mostUsedRawMaterials: [],
  expiringRawMaterials: [],
  lowestStocks: [],
  highestStocks: [],
  purchaseSuggestions: [],
  totalProductsSold: 0,
  totalRevenue: 0,
  grandTotalConsumedCost: 0,
  totalReplenishmentCost: 0,
  totalStockValue: 0
};
