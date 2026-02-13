export enum FiscalStatus {
  PENDENTE = 'PENDENTE',
  EMITIDA = 'EMITIDA',
  CANCELADA = 'CANCELADA',
  ERRO = 'ERRO',
}

export interface SaleItem {
  id: number;
  itemNumber: number;
  saleId: number;
  productId: number;
  xProd: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxUnit: string | null;
  taxQuantity: number | null;
  taxUnitPrice: number | null;
  composesTotal: number;
  cfop: string | null;
  totalTaxValue: number | null;
  importTaxValue: number | null;
  iofValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleClient {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  cpf: string | null;
  active: boolean;
}

export interface SaleOperator {
  id: number;
  username: string;
  role: string;
}

export interface Sale {
  id: number;
  clientId: number;
  client: SaleClient;
  userOperator: string;
  operatorId: number | null;
  operator: SaleOperator | null;
  date: Date;
  paymentMethod: string;
  totalProductsWithoutDiscount: number;
  discount: number;
  total: number;
  profitSale: number;
  isPaid: boolean;
  cfop: string;
  fiscalStatus: FiscalStatus;
  fiscalKey: string | null;
  fiscalProtocol?: string;
  fiscalEmitDate: Date | null;
  fiscalXml: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: SaleItem[];
}

export interface CreateSaleItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  clientId?: number; // Opcional - padrão: 1 (Cliente À Vista)
  paymentMethod: string;
  items: CreateSaleItemDto[];
  discount?: number;
  cfop?: string;
}

export interface UpdateSaleDto {
  paymentMethod?: string;
  discount?: number;
  isPaid?: boolean;
  fiscalStatus?: FiscalStatus;
  cfop?: string;
}

export interface SaleFilters {
  page?: number;
  limit?: number;
  clientId?: number;
  operatorId?: number;
  paymentMethod?: string;
  fiscalStatus?: FiscalStatus;
  isPaid?: boolean;
  fiscalKey?: string;
  startDate?: string;
  endDate?: string;
}

export interface SalePaginatedResponse {
  data: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConvertOrderToSaleDto {
  clientId?: number;
  paymentMethod: string;
  discount?: number;
  cfop?: string;
}

export interface MarkAsReceivedDto {
  salesIds: number[];
}
