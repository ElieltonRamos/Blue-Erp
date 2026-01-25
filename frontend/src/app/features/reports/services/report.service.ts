import { inject, Injectable } from '@angular/core';
import { environment } from '../../../core/services/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesReportSummary } from '../types/reportsSales';

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
}
