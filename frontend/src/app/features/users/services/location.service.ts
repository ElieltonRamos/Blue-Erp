// production-locations.service.ts (Angular)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';

export interface ProductionLocation {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  order: number;
}

export interface CreateProductionLocationDto {
  code: string;
  name: string;
  description?: string;
  order?: number;
  active?: boolean;
}

export interface UpdateProductionLocationDto {
  code?: string;
  name?: string;
  description?: string;
  order?: number;
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductionLocationsService {
  private readonly apiUrl = `${environment.apiUrl}/production-locations`;
  private client = inject(HttpClient);

  /**
   * Listar todos os locais de produção
   */
  getAll(includeInactive = false): Observable<ProductionLocation[]> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    return this.client.get<ProductionLocation[]>(this.apiUrl, { params });
  }

  /**
   * Buscar local por ID
   */
  getById(id: number): Observable<ProductionLocation> {
    return this.client.get<ProductionLocation>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar local por código
   */
  getByCode(code: string): Observable<ProductionLocation> {
    return this.client.get<ProductionLocation>(`${this.apiUrl}/code/${code}`);
  }

  /**
   * Criar novo local
   */
  create(data: CreateProductionLocationDto): Observable<ProductionLocation> {
    return this.client.post<ProductionLocation>(this.apiUrl, data);
  }

  /**
   * Atualizar local
   */
  update(id: number, data: UpdateProductionLocationDto): Observable<ProductionLocation> {
    return this.client.patch<ProductionLocation>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Excluir local
   */
  delete(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Ativar/desativar local
   */
  toggleActive(id: number): Observable<ProductionLocation> {
    return this.client.patch<ProductionLocation>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  /**
   * Formatar para uso em selects
   */
  formatForSelect(locations: ProductionLocation[]) {
    return locations.map((loc) => ({
      value: loc.code,
      label: loc.name,
    }));
  }
}
