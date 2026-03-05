import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { PaginatedNotaFiscal, SefazStatus, RevenueReport } from '../types/fiscal';

@Injectable({
  providedIn: 'root',
})
export class FiscalService {
  private readonly apiUrl = `${environment.apiUrl}/fiscal`;
  private client = inject(HttpClient);

  getSefazStatus(): Observable<SefazStatus> {
    return this.client.get<SefazStatus>(`${this.apiUrl}/sefaz/status`);
  }

  getNotas(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedNotaFiscal> {
    let params = new HttpParams();

    if (filters) {
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.client.get<PaginatedNotaFiscal>(`${this.apiUrl}/nfce/list`, { params });
  }

  cancelNota(accessKey: string, justification: string): Observable<any> {
    return this.client.post<any>(`${this.apiUrl}/nfce/cancel`, { accessKey, justification });
  }

  downloadPdf(accessKey: string): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/nfce/pdf/${accessKey}`, { responseType: 'blob' });
  }

  reemitirPdf(saleId: number): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/nfce/reprint/${saleId}`, { responseType: 'blob' });
  }

  downloadXml(saleId: number): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/nfce/xml/${saleId}`, { responseType: 'blob' });
  }

  queryNota(accessKey: string): Observable<any> {
    return this.client.get<any>(`${this.apiUrl}/nfce/query`, {
      params: new HttpParams().set('accessKey', accessKey),
    });
  }

  getRevenueReport(month: string, year: string): Observable<RevenueReport> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.client.get<RevenueReport>(`${this.apiUrl}/reports/revenue`, { params });
  }

  exportCsv(month: string, year: string): Observable<Blob> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.client.get(`${this.apiUrl}/reports/export`, { params, responseType: 'blob' });
  }
}
