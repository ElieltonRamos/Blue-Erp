export type PaymentMethod = 'DINHEIRO' | 'CARTAO' | 'PIX' | 'NOTINHA';

export interface SalesReportSummary {
  totalSales: number;
  grossRevenue: number;
  grossProfit: number;
  totalDiscounts: number;

  salesByPaymentMethod: {
    pix: number;
    cash: number;
    card: number;
    promissoryNote: number;
  };

  salesByOperator: {
    operator: string;
    totalSales: number;
    revenue: number;
    paymentBreakdown: {
      pix: number;
      cash: number;
      card: number;
      promissoryNote: number;
    };
  }[];
}

export interface ServiceResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
}
