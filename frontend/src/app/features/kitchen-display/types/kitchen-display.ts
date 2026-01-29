// types/kitchen.types.ts
// Tipos centralizados para o sistema de cozinha

export interface Recipe {
  title: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
}

export interface KitchenOrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  notes?: string;
  recipe?: Recipe;
}

export type KitchenOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'delivery';
  customerName?: string;
  items: KitchenOrderItem[];
  status: KitchenOrderStatus;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
}

export interface UpdateKitchenOrderStatusDto {
  status: KitchenOrderStatus;
  timestamp?: string;
}