// services/business-partner.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../core/services/environment';
import {
  BusinessPartner,
  BusinessPartnerFilters,
  CreateBusinessPartnerDTO,
  UpdateBusinessPartnerDTO,
} from '../types/business-partner';

@Injectable({
  providedIn: 'root',
})
export class BusinessPartnerService {
  private apiUrl = `${environment.apiUrl}/purchases/business-partners`;
  private client = inject(HttpClient);

  getAll(filters?: BusinessPartnerFilters): Observable<BusinessPartner[]> {
    let params = new HttpParams();

    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.client.get<BusinessPartner[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<BusinessPartner> {
    return this.client.get<BusinessPartner>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateBusinessPartnerDTO): Observable<BusinessPartner> {
    return this.client.post<BusinessPartner>(this.apiUrl, this.cleanPayload(dto));
  }

  update(id: number, dto: UpdateBusinessPartnerDTO): Observable<BusinessPartner> {
    return this.client.patch<BusinessPartner>(`${this.apiUrl}/${id}`, this.cleanPayload(dto));
  }

  remove(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Remove campos vazios ('' / null / undefined) para não falhar nos validadores opcionais do backend
  private cleanPayload<T extends object>(dto: T): Partial<T> {
    const payload: Partial<T> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== '' && value !== null && value !== undefined) {
        payload[key as keyof T] = value as T[keyof T];
      }
    }
    return payload;
  }
}
