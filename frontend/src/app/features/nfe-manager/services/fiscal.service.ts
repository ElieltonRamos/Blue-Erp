import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import {
  PaginatedNotaFiscal,
  SefazStatus,
  RevenueReport,
  EmitNfeRequest,
  NfeEmissionResult,
  EmissionResult,
} from '../types/fiscal';

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

    return this.client.get<any>(`${this.apiUrl}/list`, { params }).pipe(
      map((res) => ({
        ...res,
        data: res.data.map((item: any) => ({
          ...item,
          clientName: item.client?.name ?? '—',
          total: Number(item.total).toFixed(2),
          nNF: item.fiscalKey ? parseInt(item.fiscalKey.substring(25, 34)) : '—',
        })),
      })),
    );
  }

  cancelNota(accessKey: string, justification: string): Observable<any> {
    return this.client.post<any>(`${this.apiUrl}/cancel`, { accessKey, justification });
  }

  downloadPdf(accessKey: string): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/pdf/${accessKey}`, { responseType: 'blob' });
  }

  reemitirPdf(saleId: number): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/reprint/${saleId}`, { responseType: 'blob' });
  }

  downloadXml(saleId: number): Observable<Blob> {
    return this.client.get(`${this.apiUrl}/xml/${saleId}`, { responseType: 'blob' });
  }

  queryNota(accessKey: string): Observable<any> {
    return this.client.get<any>(`${this.apiUrl}/query`, {
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

  emitNfe(request: EmitNfeRequest): Observable<NfeEmissionResult> {
    return this.client.post<NfeEmissionResult>(`${this.apiUrl}/nfe/emit`, request);
  }

  emitNfce(saleId: number, generateDanfe = true): Observable<EmissionResult> {
    return this.client.post<EmissionResult>(`${this.apiUrl}/nfce/emit`, { saleId, generateDanfe });
  }
  formatAccessKey(key: string): string {
    if (!key || key.length !== 44) return key;
    return key.match(/.{1,4}/g)?.join(' ') || key;
  }
}
