import { PaymentType } from '../../checkout/types/checkout';

export type FulfillmentType = 'delivery' | 'pickup';

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'canceled';

export interface OrderCustomer {
  name: string;
  /** Somente dígitos, com DDD. */
  phone: string;
}

export interface OrderAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

export interface OrderPayment {
  type: PaymentType;
  /** Valor com que o cliente vai pagar, para calcular o troco (só em dinheiro). */
  changeFor: number | null;
}

/** Item enviado ao criar o pedido. O backend recalcula os preços a partir dos ids. */
export interface OrderItemRequest {
  productId: number;
  quantity: number;
  observation: string;
  selections: { optionId: number; quantity: number }[];
}

/** Corpo do POST /api/public/orders. */
export interface OrderRequest {
  fulfillment: FulfillmentType;
  customer: OrderCustomer;
  /** null na retirada. */
  address: OrderAddress | null;
  payment: OrderPayment;
  items: OrderItemRequest[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  observation: string;
  selections: { name: string; quantity: number }[];
  /** Total da linha (já multiplicado pela quantidade). */
  total: number;
}

/** Resposta do POST /api/public/orders e do GET /api/public/orders/:id. */
export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  fulfillment: FulfillmentType;
  customer: OrderCustomer;
  address: OrderAddress | null;
  payment: OrderPayment & { label: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}
