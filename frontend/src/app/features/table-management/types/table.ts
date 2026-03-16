export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface TableLocation {
  id: number;
  code: string;
  name: string;
}

export interface OrderItem {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: number;
  observation?: string;
}

export interface TableOrder {
  id: number;
  type: string;
  locationId: string;
  customerName: string | null;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: TableStatus;
  customer: string | null;
  time: string | null;
  locationId: number;
  location: TableLocation;
  orderId: number | null;
  order: TableOrder | null;
  createdAt: string;
  updatedAt: string;
}

export class UpdateTableDto {
  number?: number;
  capacity?: number;
  locationId?: number;
  customer?: string;
}

export interface CloseTabResponse {
  orderId: number;
  total: number;
  message: string;
}
