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
  private apiUrl = `${environment.apiUrl}/business-partners`;
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
    return this.client.post<BusinessPartner>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateBusinessPartnerDTO): Observable<BusinessPartner> {
    return this.client.patch<BusinessPartner>(`${this.apiUrl}/${id}`, dto);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
