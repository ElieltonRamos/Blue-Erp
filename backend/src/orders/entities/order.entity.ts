export class OrderItemEntity {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kitchenReadyAt: Date | null;
  orderId: string;
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
  kitchenSentAt: Date | null;
  kitchenReadyAt: Date | null;
  finishedAt: Date | null;
  deliveredAt: Date | null;
  tableOccupiedUtil: Date | null;
  operatorId: number | null;
  items: OrderItemEntity[];
}
