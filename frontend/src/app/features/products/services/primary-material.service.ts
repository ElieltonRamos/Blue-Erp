import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import {
  CreatePrimaryMaterialDTO,
  FilterPrimaryMaterialParams,
  GetSuggestedCode,
  MaterialSummary,
  PrimaryMaterial,
  StockAlert,
  UpdatePrimaryMaterialDTO,
} from '../types/primary-material';

@Injectable({
  providedIn: 'root',
})
export class PrimaryMaterialService {
  private apiUrl = `${environment.apiUrl}/primary-materials`;
  private client = inject(HttpClient);

  getAll(
    page: number,
    pageLimit: number,
    filters?: FilterPrimaryMaterialParams,
    sortKey: string = 'id',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<PrimaryMaterial>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageLimit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.unit) params = params.set('unit', filters.unit);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());
    if (filters?.lowStock !== undefined)
      params = params.set('lowStock', filters.lowStock.toString());

    return this.client.get<PaginatedResponse<PrimaryMaterial>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<PrimaryMaterial> {
    return this.client.get<PrimaryMaterial>(`${this.apiUrl}/${id}`);
  }

  getByCode(code: string): Observable<PrimaryMaterial> {
    return this.client.get<PrimaryMaterial>(`${this.apiUrl}/code/${code}`);
  }

  getSummary(): Observable<MaterialSummary> {
    return this.client.get<MaterialSummary>(`${this.apiUrl}/summary`);
  }

  getStockAlerts(): Observable<StockAlert[]> {
    return this.client.get<StockAlert[]>(`${this.apiUrl}/stock-alerts`);
  }

  create(material: CreatePrimaryMaterialDTO): Observable<PrimaryMaterial> {
    return this.client.post<PrimaryMaterial>(this.apiUrl, material);
  }

  update(id: number, material: UpdatePrimaryMaterialDTO): Observable<PrimaryMaterial> {
    return this.client.patch<PrimaryMaterial>(`${this.apiUrl}/${id}`, material);
  }

  delete(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSuggestedCode(): Observable<GetSuggestedCode> {
    return this.client.get<GetSuggestedCode>(`${this.apiUrl}/suggested-code`);
  }
}
