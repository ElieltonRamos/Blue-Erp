import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import {
  Sale,
  CreateSaleDto,
  UpdateSaleDto,
  SaleFilters,
  SalePaginatedResponse,
  MarkAsReceivedDto,
} from '../types/sale';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;
  private client = inject(HttpClient);

  createSale(dto: CreateSaleDto): Observable<Sale> {
    return this.client.post<Sale>(this.apiUrl, dto);
  }

  getSales(filters?: SaleFilters): Observable<SalePaginatedResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.clientId) params = params.set('clientId', filters.clientId.toString());
      if (filters.operatorId) params = params.set('operatorId', filters.operatorId.toString());
      if (filters.paymentMethod) params = params.set('paymentMethod', filters.paymentMethod);
      if (filters.fiscalStatus) params = params.set('fiscalStatus', filters.fiscalStatus);
      if (filters.isPaid !== undefined) params = params.set('isPaid', filters.isPaid.toString());
      if (filters.fiscalKey) params = params.set('fiscalKey', filters.fiscalKey);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.client.get<SalePaginatedResponse>(this.apiUrl, { params });
  }

  getSaleById(id: number): Observable<Sale> {
    return this.client.get<Sale>(`${this.apiUrl}/${id}`);
  }

  updateSale(id: number, dto: UpdateSaleDto): Observable<Sale> {
    return this.client.patch<Sale>(`${this.apiUrl}/${id}`, dto);
  }

  deleteSale(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  markAsReceived(dto: MarkAsReceivedDto): Observable<{ message: string }> {
    return this.client.patch<{ message: string }>(`${this.apiUrl}/mark-as-received`, dto);
  }
}
