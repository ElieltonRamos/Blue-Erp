export interface SalePaymentDto {
  method: string;
  amount: number;
  change?: number;
}

export interface ConvertOrderToSaleDto {
  payments: SalePaymentDto[];
  clientId?: number;
  discount?: number;
  cfop?: string;
}
