import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesReportResponse } from '../types/reportsSales';
import { ProductReport, ProductReportSummary } from '../types/reportProducts';
import { ReportExpense } from '../types/reportExpense';
import { OrderReport, OrderReportSummary } from '../types/reportOrders';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  generateReportSales(startDate: string, endDate: string): Observable<SalesReportResponse> {
    return this.client.get<SalesReportResponse>(`${this.apiUrl}/reports/sales`, {
      params: {
        startDate,
        endDate,
      },
    });
  }

  /**
   * Gera relatório de produtos com base no período selecionado
   * @param startDate - Data inicial no formato YYYY-MM-DD
   * @param endDate - Data final no formato YYYY-MM-DD
   * @returns Observable com os dados do relatório de produtos
   */
  generateReportProducts(startDate: string, endDate: string): Observable<ProductReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.client.get<ProductReport>(`${this.apiUrl}/reports/products`, { params });
  }

  getExpensesReport(startDate: string, endDate: string): Observable<ReportExpense> {
    const params = { startDate, endDate };
    return this.client.get<ReportExpense>(`${this.apiUrl}/reports/expenses`, { params });
  }

  /**
   * Gera relatório de pedidos com base no período selecionado
   * @param startDate - Data inicial no formato YYYY-MM-DD
   * @param endDate - Data final no formato YYYY-MM-DD
   * @returns Observable com os dados do relatório de pedidos
   */
  generateReportOrders(startDate: string, endDate: string): Observable<OrderReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.client.get<OrderReport>(`${this.apiUrl}/reports/orders`, { params });
  }
}