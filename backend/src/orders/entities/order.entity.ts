export class OrderItemEntity {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kitchenReadyAt: Date | null;
  orderId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderEntity {
  id: number;
  type: string;
  locationId: string;
  customerName: string | null;
  table: string | null;
  address: string | null;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  tableOccupiedUntil: Date | null;
  operatorId: number | null;
  closedByOperatorId: number | null;
  items: OrderItemEntity[];
}
