export interface SaleItem {
  id?: number;
  itemNumber: number;
  saleId: number;
  productId: number;
  xProd?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxUnit?: string;
  taxQuantity?: number;
  taxUnitPrice?: number;
  composesTotal: number;
  cfop?: string;
  totalTaxValue?: number;
  importTaxValue?: number;
  iofValue?: number;
}

export interface Sale {
  id?: number;
  clientId: number;
  userOperator: string;
  operatorId?: number;
  paymentMethod: string;
  date: Date;
  items?: SaleItem[]; // MUDOU DE products PARA items
  totalProductsWithoutDiscount: number;
  total: number;
  isPaid: boolean;
  discount: number;
  profitSale: number;
  client?: { id?: number; name: string; cpf?: string; address?: string };
  cfop: string;
  fiscalStatus?: string;
  fiscalKey?: string;
  fiscalProtocol?: string;
  fiscalEmitDate?: Date;
  operator?: { id: number; username: string; role: string };
  address?: string; // ADICIONADO do pedido
  nfceStatus?: 'pendente' | 'emitida' | 'cancelada' | 'erro';
  nfceKey?: string;
  nfceProtocol?: string;
  dateNfceEmit?: Date;
}
