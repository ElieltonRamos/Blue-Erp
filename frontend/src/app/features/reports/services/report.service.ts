import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesReportResponse } from '../types/reportsSales';
import { ProductReport } from '../types/reportProducts';
import { ReportExpense } from '../types/reportExpense';
import { OrderReport } from '../types/reportOrders';
import { LocationReportResponse } from '../types/reportLocations';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  generateReportSales(startDate: string, endDate: string): Observable<SalesReportResponse> {
    return this.client.get<SalesReportResponse>(`${this.apiUrl}/reports/sales`, {
      params: { startDate, endDate },
    });
  }

  generateReportProducts(startDate: string, endDate: string): Observable<ProductReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.client.get<ProductReport>(`${this.apiUrl}/reports/products`, { params });
  }

  getExpensesReport(startDate: string, endDate: string): Observable<ReportExpense> {
    const params = { startDate, endDate };
    return this.client.get<ReportExpense>(`${this.apiUrl}/reports/expenses`, { params });
  }

  generateReportOrders(startDate: string, endDate: string): Observable<OrderReport> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.client.get<OrderReport>(`${this.apiUrl}/reports/orders`, { params });
  }

  generateReportLocations(startDate: string, endDate: string): Observable<LocationReportResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.client.get<LocationReportResponse>(`${this.apiUrl}/reports/locations`, { params });
  }
}
