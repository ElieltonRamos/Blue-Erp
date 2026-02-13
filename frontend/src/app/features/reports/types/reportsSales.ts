// Estrutura igual ao backend

export interface PaymentMethodBreakdown {
  pix: number;
  cash: number;
  card: number;
  promissoryNote: number;
}

export interface OperatorSales {
  operator: string;
  totalSales: number;
  revenue: number;
  paymentBreakdown: PaymentMethodBreakdown;
}

export interface SalesReportSummary {
  totalSales: number;
  grossRevenue: number;
  grossProfit: number;
  totalDiscounts: number;
  salesByPaymentMethod: PaymentMethodBreakdown;
  salesByOperator: OperatorSales[];
}

// 🔥 NOVO — resposta completa da API
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
    pix: 0,
    cash: 0,
    card: 0,
    promissoryNote: 0,
  },
  salesByOperator: [],
};
