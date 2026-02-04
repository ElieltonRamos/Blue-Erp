import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

// primary-material.service.ts
export interface CreatePrimaryMaterialDTO {
  name: string;
  code: string;
  unit: string;
  unitCost: number;
  currentStock?: number;
  minStock?: number;
  expiryDate?: Date;
  active?: boolean;
  ncm?: string;
  cfop?: string;
}

export interface PrimaryMaterial {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minStock?: number;
  expiryDate?: Date;
  active: boolean;
  ncm?: string;
  cfop?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePrimaryMaterialDTO {
  name?: string;
  code?: string;
  unit?: string;
  unitCost?: number;
  currentStock?: number;
  active?: boolean;
  ncm?: string;
  cfop?: string;
}

export interface MaterialSummary {
  totalMaterials: number;
  activeMaterials: number;
  inactiveMaterials: number;
  totalStockValue: number;
  materialsLowStock: number;
  totalItems: number;
}

export interface StockAlert {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  unitCost: number;
  estimatedValue: number;
}

export interface FilterPrimaryMaterialParams {
  search?: string;
  unit?: string;
  active?: boolean;
  lowStock?: boolean;
}

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
      .set('pageLimit', pageLimit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.unit) params = params.set('unit', filters.unit);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());
    if (filters?.lowStock !== undefined)
      params = params.set('lowStock', filters.lowStock.toString());

    return this.client.get<PaginatedResponse<PrimaryMaterial>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<PrimaryMaterial> {
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

  update(id: string, material: UpdatePrimaryMaterialDTO): Observable<PrimaryMaterial> {
    return this.client.patch<PrimaryMaterial>(`${this.apiUrl}/${id}`, material);
  }

  delete(id: string): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/${id}`);
  }
}
