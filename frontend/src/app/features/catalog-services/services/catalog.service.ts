import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import {
  CreateServiceDTO,
  FilterServiceParams,
  Service,
  UpdateServiceDTO,
} from '../types/catalog-types';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private apiUrl = `${environment.apiUrl}/services`;
  private client = inject(HttpClient);

  getAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterServiceParams,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<Service>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());

    return this.client.get<PaginatedResponse<Service>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Service> {
    return this.client.get<Service>(`${this.apiUrl}/${id}`);
  }

  create(service: CreateServiceDTO): Observable<Service> {
    return this.client.post<Service>(this.apiUrl, service);
  }

  update(id: number, service: UpdateServiceDTO): Observable<Service> {
    return this.client.patch<Service>(`${this.apiUrl}/${id}`, service);
  }

  delete(id: number): Observable<Service> {
    return this.client.delete<Service>(`${this.apiUrl}/${id}`);
  }
}
