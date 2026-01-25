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
