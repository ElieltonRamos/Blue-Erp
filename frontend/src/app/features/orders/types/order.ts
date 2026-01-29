// types/order.types.ts
// Tipos centralizados para o sistema de pedidos

export interface OrderItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'open' | 'closed' | 'canceled';
export type OrderType = 'dine_in' | 'delivery';

export interface Order {
  id: string;
  type: OrderType;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  table?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderDto {
  type: OrderType;
  customerName?: string;
  items: OrderItem[];
  total: number;
  table?: string;
  address?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
}

export interface OrderFilters {
  searchName?: string;
  searchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}