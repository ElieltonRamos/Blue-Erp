import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import Expense, { ExpenseFilters, ReportExpense } from '../types/Expense';
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
    return this.client.delete<void>(`${this.apiUrl}/expenses/delete/${id}`);
  }

  createExpense(expense: Expense): Observable<Expense> {
    return this.client.post<Expense>(`${this.apiUrl}/expenses`, expense);
  }

  updateExpense(expense: Expense): Observable<Expense> {
    return this.client.patch<Expense>(`${this.apiUrl}/expenses/update/${expense.id}`, expense);
  }

  getExpensesReport(startDate: string, endDate: string): Observable<ReportExpense> {
    const params = { startDate, endDate };
    return this.client.get<ReportExpense>(`${this.apiUrl}/expenses/reports`, { params });
  }

  markSaleReceived(salesId: number[]): Observable<any> {
    return this.client.patch(`${this.apiUrl}/sale/received`, { salesId });
  }

  getSales(
    page: number,
    pageLimit: number,
    filters: {
      id?: string;
      startDate?: string;
      endDate?: string;
      client?: string;
      operator?: string;
      paymentMethod?: string;
      isPaid?: boolean;
    } = {},
  ): Observable<PaginatedResponse<Sale>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageLimit', pageLimit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value as any);
      }
    });

    return this.client.get<PaginatedResponse<Sale>>(`${this.apiUrl}/sale`, {
      params,
    });
  }
}
