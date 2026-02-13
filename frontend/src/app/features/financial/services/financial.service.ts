import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import Expense, { ExpenseFilters } from '../types/Expense';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import { Sale } from '../../sales/types/sale';

@Injectable({
  providedIn: 'root',
})
export class FinancialService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  getAllExpenses(
    page: number,
    limit: number,
    filters: ExpenseFilters = {},
    sortBy: string = '',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Observable<PaginatedResponse<Expense>> {
    const params: any = {
      page,
      limit,
      sortBy,
      sortOrder,
      supplier: filters.supplier || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };

    return this.client.get<PaginatedResponse<Expense>>(`${this.apiUrl}/expenses`, { params });
  }
  deleteExpense(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/expenses/${id}`);
  }

  createExpense(expense: Expense): Observable<Expense> {
    return this.client.post<Expense>(`${this.apiUrl}/expenses`, expense);
  }

  updateExpense(expense: Expense): Observable<Expense> {
    return this.client.patch<Expense>(`${this.apiUrl}/expenses/${expense.id}`, expense);
  }
}
