export default interface Expense {
  id?: number;
  supplier: string;
  description: string;
  value: number;
  datePayment: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
}

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

// interfaces/ExpenseFilters.ts
export interface ExpenseFilters {
  supplier?: string;
  status?: 'Pago' | 'Pendente' | 'Atrasado' | '';
  startDate?: string;
  endDate?: string;
}
