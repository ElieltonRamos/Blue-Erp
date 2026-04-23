import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { Table, CloseTabResponse, UpdateTableDto } from '../types/table';

@Injectable({
  providedIn: 'root',
})
export class TableService {
  private readonly apiUrl = `${environment.apiUrl}/tables`;
  private client = inject(HttpClient);

  getTables(locationId?: number): Observable<Table[]> {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }
    return this.client.get<Table[]>(this.apiUrl, { params });
  }

  getTableById(id: number): Observable<Table> {
    return this.client.get<Table>(`${this.apiUrl}/${id}`);
  }

  createTable(data: { number: number; capacity: number; locationId: number }): Observable<Table> {
    return this.client.post<Table>(this.apiUrl, data);
  }

  editTable(id: number, data: UpdateTableDto): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/${id}`, data);
  }

  deleteTable(id: number): Observable<{ message: string }> {
    return this.client.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  occupyTable(id: number, customer: string): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/${id}/occupy`, { customer });
  }

  releaseTable(id: number): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/${id}/release`, {});
  }

  reserveTable(id: number, customer: string, time: string): Observable<Table> {
    return this.client.patch<Table>(`${this.apiUrl}/${id}/reserve`, { customer, time });
  }

  closeTab(id: number, serviceCharge?: number): Observable<CloseTabResponse> {
    return this.client.post<CloseTabResponse>(`${this.apiUrl}/${id}/close-tab`, { serviceCharge });
  }
}
