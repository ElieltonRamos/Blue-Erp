// services/purchase.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    const params: any = {
      page,
      limit,
      status: filters.status || undefined,
      supplier: filters.supplier || undefined,
    };

    return this.client.get<PaginatedResponse<Purchase>>(`${this.apiUrl}/purchases`, { params });
  }

  getPurchase(id: number): Observable<Purchase> {
    return this.client.get<Purchase>(`${this.apiUrl}/purchases/${id}`);
  }

  cancelPurchase(id: number): Observable<{ message: string }> {
    return this.client.patch<{ message: string }>(`${this.apiUrl}/purchases/${id}/cancel`, {});
  }
}
