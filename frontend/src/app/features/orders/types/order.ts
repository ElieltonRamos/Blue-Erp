// Types para o módulo de Orders no Angular

export interface OrderItem {
  id?: string;
  productId: number;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kitchenReadyAt?: Date;
}

export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELED';
export type OrderType = 'DINE_IN' | 'DELIVERY';
export type OrderLocation = 'LOCAL_01' | 'LOCAL_02' | 'LOCAL_03' | 'DELIVERY';

export interface Order {
  id: number;
  type: OrderType;
  locationId: OrderLocation;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  table?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  kitchenSentAt?: Date;
  kitchenReadyAt?: Date;
  finishedAt?: Date;
  deliveredAt?: Date;
  tableOccupiedUtil?: Date;
  operatorId?: number;
  operator?: {
    id: number;
    username: string;
  };
}

export interface CreateOrderDto {
  type: OrderType;
  locationId: OrderLocation;
  customerName?: string;
  items: OrderItem[];
  total: number;
  table?: string;
  address?: string;
  operatorId?: number;
}

export interface UpdateOrderDto {
  customerName?: string;
  table?: string;
  address?: string;
  status?: OrderStatus;
  items?: OrderItem[];
  total?: number;
}

export interface OrderFilters {
  searchName?: string;
  searchId?: number;
  status?: OrderStatus;
  location?: OrderLocation;
  type?: OrderType;
  table?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderPaginatedResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Product types (para busca)
export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  costPrice: number;
  unit: string;
  quantity: number;
  active: boolean;
  ncm: string;
  cest?: string;
  origin: number;
  csosn?: string;
  cst?: string;
  cstPis?: string;
  cstCofins?: string;
  federalTaxRate?: number;
  stateTaxRate?: number;
  municipalTaxRate?: number;
  productionLocation?: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface SearchProductDto {
  code?: string;
  name?: string;
  limit?: number;
}
