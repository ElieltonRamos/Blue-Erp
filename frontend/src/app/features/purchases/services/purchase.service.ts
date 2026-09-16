// services/purchase.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import {
  CreatePurchaseFromXml,
  ParsedPurchasePreview,
  Purchase,
  PurchaseFilters,
} from '../types/purchase';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  parseXml(file: File): Observable<ParsedPurchasePreview> {
    const formData = new FormData();
    formData.append('file', file);

    return this.client.post<ParsedPurchasePreview>(`${this.apiUrl}/purchases/parse-xml`, formData);
  }

  createPurchase(dto: CreatePurchaseFromXml): Observable<Purchase> {
    return this.client.post<Purchase>(`${this.apiUrl}/purchases`, dto);
  }

  getAllPurchases(
    page: number,
    limit: number,
    filters: PurchaseFilters = {},
  ): Observable<PaginatedResponse<Purchase>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filters.status) params = params.set('status', filters.status);
    if (filters.supplier) params = params.set('supplier', filters.supplier);
    if (filters.invoiceNumber) params = params.set('invoiceNumber', filters.invoiceNumber);
    if (filters.fiscalKey) params = params.set('fiscalKey', filters.fiscalKey);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.client.get<PaginatedResponse<Purchase>>(`${this.apiUrl}/purchases`, { params });
  }
  
  getPurchase(id: number): Observable<Purchase> {
    return this.client.get<Purchase>(`${this.apiUrl}/purchases/${id}`);
  }

  cancelPurchase(id: number): Observable<{ message: string }> {
    return this.client.patch<{ message: string }>(`${this.apiUrl}/purchases/${id}/cancel`, {});
  }

  removePurchase(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/purchases/${id}`);
  }
}
