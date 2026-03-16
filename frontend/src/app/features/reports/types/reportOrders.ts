// types/reportOrders.ts

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
  preparationTime?: number; // kitchenSentAt → kitchenReadyAt (minutos)
  totalOrderTime?: number; // createdAt → finishedAt (minutos)
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

  // Totais
  totalOrders: number;
  totalRevenue: number;
  percentage: number; // % do faturamento total
  averageOrderValue: number;

  // Métricas de tempo
  averagePreparationTime: number; // kitchenSentAt → kitchenReadyAt
  averageTotalOrderTime: number; // createdAt → finishedAt

  // Métricas operacionais
  cancellationRate: number; // % de pedidos cancelados
  kitchenPassRate: number; // % de pedidos que passaram pela cozinha
  averageItemsPerOrder: number;

  // Pico
  peakHour: number | null; // hora com mais pedidos
  peakConcurrentOrders: number; // máximo de pedidos simultâneos

  // Mesas (DINE_IN)
  tableOccupancyRate: number | null; // % mesas com pedido / total mesas do local
  averageTableOccupationTime: number | null; // minutos médios de ocupação

  // Receita por hora do local
  revenueByHour: TimeDistribution[];

  // Distribuições internas
  ordersByStatus: StatusDistribution[];
  ordersByType: OrderTypeDistribution[];

  // Top produtos do local
  topProducts: ProductPerformance[];

  // Mesas mais ativas
  topTables: {
    table: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
}

export interface OrderReportSummary {
  // Totais globais
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
  averageTotalOrderTime: number;
  cancellationRate: number;
  averageItemsPerOrder: number;

  // Distribuições globais
  ordersByStatus: StatusDistribution[];
  ordersByType: OrderTypeDistribution[];
  ordersByHour: TimeDistribution[];

  // Visão gerencial por local
  byLocation: LocationReport[];

  // Rankings globais
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

  // Listas de pedidos
  recentOrders: OrderSummary[];
  slowestOrders: OrderSummary[];
  fastestOrders: OrderSummary[];
}

export interface OrderReport {
  status: string;
  data: OrderReportSummary;
}

export const orderReportMock: OrderReportSummary = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  averagePreparationTime: 0,
  averageTotalOrderTime: 0,
  cancellationRate: 0,
  averageItemsPerOrder: 0,
  ordersByStatus: [],
  ordersByType: [],
  ordersByHour: [],
  byLocation: [],
  topProducts: [],
  topTables: [],
  topCustomers: [],
  recentOrders: [],
  slowestOrders: [],
  fastestOrders: [],
};
