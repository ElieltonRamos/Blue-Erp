export type OrderStatusDB = 'OPEN' | 'CLOSED' | 'CANCELED' | 'PAID';
export type OrderTypeDB = 'DINE_IN' | 'DELIVERY';

export interface OrderSummary {
  orderId: number;
  table?: string;
  type: OrderTypeDB;
  locationId: string;
  locationName: string;
  customerName?: string;
  totalItems: number;
  totalRevenue: number;
  status: OrderStatusDB;
  createdAt: string;
  finishedAt?: string;
  preparationTime?: number;
  totalOrderTime?: number;
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  totalOrdered: number;
  totalRevenue: number;
  averagePreparationTime: number;
}

export interface TimeDistribution {
  hour: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface StatusDistribution {
  status: OrderStatusDB;
  count: number;
  percentage: number;
}

export interface OrderTypeDistribution {
  type: OrderTypeDB;
  count: number;
  percentage: number;
  totalRevenue: number;
}

export interface LocationReport {
  locationId: string;
  locationName: string;
  totalOrders: number;
  totalRevenue: number;
  percentage: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  averageTotalOrderTime: number;
  cancellationRate: number;
  kitchenPassRate: number;
  averageItemsPerOrder: number;
  peakHour: number | null;
  peakConcurrentOrders: number;
  tableOccupancyRate: number | null;
  averageTableOccupationTime: number | null;
  revenueByHour: TimeDistribution[];
  ordersByStatus: StatusDistribution[];
  ordersByType: OrderTypeDistribution[];
  topProducts: ProductPerformance[];
  topTables: { table: string; totalOrders: number; totalRevenue: number }[];
}

export interface OrderReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  averageTotalOrderTime: number;
  cancellationRate: number;
  averageItemsPerOrder: number;
  ordersByStatus: StatusDistribution[];
  ordersByType: OrderTypeDistribution[];
  ordersByHour: TimeDistribution[];
  byLocation: LocationReport[];
  topProducts: ProductPerformance[];
  topTables: {
    table: string;
    locationId: string;
    locationName: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
  topCustomers: {
    customerName: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
  recentOrders: OrderSummary[];
  slowestOrders: OrderSummary[];
  fastestOrders: OrderSummary[];
}
