export interface ConvertOrderToSaleDto {
  paymentMethod: string;
  clientId?: number;
  discount?: number;
  cfop: string;
}
