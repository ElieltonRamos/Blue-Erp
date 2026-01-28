import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesReportSummary } from '../types/reportsSales';
import { ProductReportSummary } from '../types/reportProducts';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  generateReportSales(startDate: string, endDate: string): Observable<SalesReportSummary> {
    return this.client.get<SalesReportSummary>(`${this.apiUrl}/report/sales`, {
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
  generateReportProducts(startDate: string, endDate: string): Observable<ProductReportSummary> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.client.get<ProductReportSummary>(`${this.apiUrl}/reports/products`, { params });
  }
}
