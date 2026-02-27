export interface PaymentBreakdown {
  dinheiro: number;
  cartaoCredito: number;
  cartaoDebito: number;
  pix: number;
  creditoLoja: number;
}

export interface OperatorSales {
  operator: string;
  totalSales: number;
  revenue: number;
  paymentBreakdown: PaymentBreakdown;
}

export interface SalesReportSummary {
  totalSales: number;
  grossRevenue: number;
  grossProfit: number;
  totalDiscounts: number;
  salesByPaymentMethod: PaymentBreakdown;
  salesByOperator: OperatorSales[];
}

export interface SalesReportResponse {
  status: 'OK' | 'ERROR';
  data?: SalesReportSummary;
  message?: string;
}

export const summaryMock: SalesReportSummary = {
  totalSales: 0,
  grossRevenue: 0,
  grossProfit: 0,
  totalDiscounts: 0,
  salesByPaymentMethod: {
    dinheiro: 0,
    cartaoCredito: 0,
    cartaoDebito: 0,
    pix: 0,
    creditoLoja: 0,
  },
  salesByOperator: [],
};
