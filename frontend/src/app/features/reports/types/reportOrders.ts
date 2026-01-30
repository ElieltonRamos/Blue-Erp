// types/reportOrders.ts
// Tipos para o relatório de pedidos

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'delivery';
  customerName?: string;
  totalItems: number;
  totalRevenue: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
  completedAt?: string;
  preparationTime?: number; // em minutos
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalOrdered: number;
  totalRevenue: number;
  averagePreparationTime: number; // em minutos
}

export interface TimeDistribution {
  hour: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface StatusDistribution {
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  count: number;
  percentage: number;
}

export interface OrderTypeDistribution {
  type: 'dine_in' | 'delivery';
  count: number;
  percentage: number;
  totalRevenue: number;
}

export interface OrderReportSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number; // em minutos

  // Distribuições
  ordersByStatus: StatusDistribution[];
  ordersByType: OrderTypeDistribution[];
  ordersByHour: TimeDistribution[];

  // Top produtos
  topProducts: ProductPerformance[];

  // Pedidos recentes
  recentOrders: OrderSummary[];

  // Pedidos mais lentos
  slowestOrders: OrderSummary[];

  // Pedidos mais rápidos
  fastestOrders: OrderSummary[];

  // Mesas mais ativas
  topTables: {
    table: string;
    totalOrders: number;
    totalRevenue: number;
  }[];

  // Clientes mais frequentes (delivery)
  topCustomers: {
    customerName: string;
    totalOrders: number;
    totalRevenue: number;
  }[];
}

// Mock data para desenvolvimento
export const orderReportMock: OrderReportSummary = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  averagePreparationTime: 0,
  ordersByStatus: [],
  ordersByType: [],
  ordersByHour: [],
  topProducts: [],
  recentOrders: [],
  slowestOrders: [],
  fastestOrders: [],
  topTables: [],
  topCustomers: [],
};
