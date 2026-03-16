export interface PaymentBreakdown {
  dinheiro: number;
  cartaoCredito: number;
  cartaoDebito: number;
  pix: number;
  creditoLoja: number;
}

export interface SalesReportSummary {
  totalSales: number;
  grossRevenue: number;
  grossProfit: number;
  totalDiscounts: number;

  salesByPaymentMethod: PaymentBreakdown;

  salesByOperator: {
    operator: string;
    totalSales: number;
    revenue: number;
    paymentBreakdown: PaymentBreakdown;
  }[];
}

export interface ServiceResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
}
