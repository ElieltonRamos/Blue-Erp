// dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../core/services/environment';
import { AutoClosedOrder } from '../types/auto-closed-order';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private client = inject(HttpClient);

  getAutoClosedOrders(): Observable<AutoClosedOrder[]> {
    return this.client.get<AutoClosedOrder[]>(`${this.apiUrl}/auto-closed`);
  }

  getClosedWithoutPayment(): Observable<AutoClosedOrder[]> {
    return this.client.get<AutoClosedOrder[]>(`${this.apiUrl}/closed-without-payment`);
  }
}
