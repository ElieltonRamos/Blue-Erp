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
export type PaymentMethod = 'money' | 'credit' | 'debit' | 'pix' | 'term';

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
  ncm?: string;
  cfop?: string;
  csosn?: string;
  origem?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface OrderFilters {
  searchName?: string;
  searchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SaleItem {
  saleId?: number;
  productId: number;
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cfop: string;
  csosn: string;
  origem: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  uCom: string;
  qCom: number;
  vUnCom: number;
  indTot: 0 | 1;
  uTrib?: string;
  qTrib?: number;
  vUnTrib?: number;
  aliqFederal?: number;
  aliqEstadual?: number;
  aliqMunicipal?: number;
  vTotTrib?: number;
  pisCst?: string;
  cofinsCst?: string;
  iiValor?: number;
  iofValor?: number;
}

export interface Sale {
  id?: number;
  clientId?: number;
  clientName: string;
  userOperator: string;
  paymentMethod: string;
  date: Date;
  products?: SaleItem[];
  totalProductsWithoutDiscount: number;
  total: number;
  isPaid: boolean;
  discount: number;
  profitSale: number;
  cfop: string;
  formattedDate?: string;
  nfceStatus?: 'pendente' | 'emitida' | 'cancelada' | 'erro';
  nfceKey?: string;
  nfceProtocol?: string;
  dateNfceEmit?: Date;
  amountReceived?: number;
  change?: number;
}

export interface FinishOrderDto {
  orderId: string;
  clientName: string;
  userOperator: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountReceived?: number;
  change?: number;
  cfop: string;
  csosn: string;
}