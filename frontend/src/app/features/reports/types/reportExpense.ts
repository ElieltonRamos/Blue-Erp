export interface ReportExpense {
  status: string;
  data: {
    totalValue: number;
    totalByStatus: {
      pago: number;
      pendente: number;
      atrasado: number;
    };
    totalBySupplier: {
      supplier: string;
      total: number;
    }[];
  };
}
