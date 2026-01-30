export interface ReportExpense {
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
}
