import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PaginatedResponse } from '../../../core/guards/types/paginator';
import {
  AddDocumentItemDTO,
  CreateDocumentDTO,
  FilterDocumentParams,
  OSDocument,
  UpdateDocumentItemDTO,
  UpdateDocumentResponsibleDTO,
  UpdateDocumentStatusDTO,
} from '../types/documents.types';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;
  private client = inject(HttpClient);

  getAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterDocumentParams,
  ): Observable<PaginatedResponse<OSDocument>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.clientId) params = params.set('clientId', filters.clientId.toString());
    if (filters?.assetId) params = params.set('assetId', filters.assetId.toString());
    if (filters?.mechanicId) params = params.set('mechanicId', filters.mechanicId.toString());
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);
    if (filters?.minTotal !== undefined)
      params = params.set('minTotal', filters.minTotal.toString());
    if (filters?.maxTotal !== undefined)
      params = params.set('maxTotal', filters.maxTotal.toString());

    return this.client.get<PaginatedResponse<OSDocument>>(this.apiUrl, { params });
  }

  updateItem(
    documentId: number,
    itemId: number,
    dto: UpdateDocumentItemDTO,
  ): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${documentId}/items/${itemId}`, dto);
  }

  updateResponsible(id: number, dto: UpdateDocumentResponsibleDTO): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${id}/responsible`, dto);
  }

  reopen(id: number): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${id}/reopen`, {});
  }

  getById(id: number): Observable<OSDocument> {
    return this.client.get<OSDocument>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDocumentDTO): Observable<OSDocument> {
    return this.client.post<OSDocument>(this.apiUrl, dto);
  }

  addItem(documentId: number, dto: AddDocumentItemDTO): Observable<OSDocument> {
    return this.client.post<OSDocument>(`${this.apiUrl}/${documentId}/items`, dto);
  }

  removeItem(documentId: number, itemId: number): Observable<OSDocument> {
    return this.client.delete<OSDocument>(`${this.apiUrl}/${documentId}/items/${itemId}`);
  }

  approve(id: number): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${id}/approve`, {});
  }

  updateStatus(id: number, dto: UpdateDocumentStatusDTO): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${id}/status`, dto);
  }

  cancel(id: number): Observable<OSDocument> {
    return this.client.patch<OSDocument>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
