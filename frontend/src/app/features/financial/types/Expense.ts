export default interface Expense {
  id?: number;
  supplier: string;
  description: string;
  value: number;
  datePayment: string;
  status: 'Pago' | 'Pendente' | 'Atrasado';
}

// interfaces/ExpenseFilters.ts
export interface ExpenseFilters {
  supplier?: string;
  status?: 'Pago' | 'Pendente' | 'Atrasado' | '';
  startDate?: string;
  endDate?: string;
}
