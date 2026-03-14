export enum ProductionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export interface PreparationStep {
  id: number;
  order: number;
  description: string;
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  title: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
}

export interface KitchenOrderItem {
  id: number;
  productId: number;
  name: string;
  code: string;
  quantity: number;
  notes?: string;
  recipe?: Recipe;
  observation?: string 
  preparationSteps?: PreparationStep[];
  // Dados da produção
  productionId: number;
  productionStatus: ProductionStatus;
  productionLocation: string;
  pendingAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  pendingDuration?: number | null;
  inProgressDuration?: number | null;
  totalDuration?: number | null;
  orderId: number;
  orderNumber: string;
  table: string;
  customerName: string;
  type: string;
  kitchen: string;
}

export type KitchenOrderStatus = 'pending' | 'preparing' | 'ready';

export interface KitchenOrder {
  // Dados do pedido
  orderId: number;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'delivery';
  customerName?: string;
  address?: string;
  kitchen: string; // LOCAL_01, LOCAL_02, LOCAL_03, DELIVERY

  // Items desta cozinha
  items: KitchenOrderItem[];

  // Status calculado (baseado nos items)
  status: KitchenOrderStatus;

  // Timestamps
  createdAt: string;
  kitchenSentAt: string;
}

export interface KitchenDisplayFilters {
  productionLocation?: string; // LOCAL_01, LOCAL_02, etc
}
