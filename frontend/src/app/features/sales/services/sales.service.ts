import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Sale } from '../types/sale';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import { SalesReportSummary } from '../types/reportsSales';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  createSale(sale: Sale): Observable<Sale> {
    return this.client.post<Sale>(`${this.apiUrl}/sale`, sale);
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

  markSaleReceived(salesId: number[]): Observable<any> {
    return this.client.patch(`${this.apiUrl}/sale/received`, { salesId });
  }

  generateReportSales(startDate: string, endDate: string): Observable<SalesReportSummary> {
    return this.client.get<SalesReportSummary>(`${this.apiUrl}/report/sales`, {
      params: {
        startDate,
        endDate,
      },
    });
  }

  requestNfce(saleId: number): Observable<any> {
    return this.client.post(`${this.apiUrl}/sales/${saleId}/nfce`, {});
  }
}
