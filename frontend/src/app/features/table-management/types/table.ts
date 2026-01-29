// types/table.types.ts
// Tipos centralizados para o sistema de mesas

export interface TableProduct {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id?: number;
  number: number;
  capacity: number;
  status: TableStatus;
  customer?: string | null;
  time?: string | null;
  products?: TableProduct[];
}

export interface ProductTable {
  id: number;
  name: string;
  price: number;
  category?: string;
}

export interface CloseTabResponse {
  saleId: number;
  total: number;
  message?: string;
}