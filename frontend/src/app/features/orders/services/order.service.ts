import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../core/services/environment';
import {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  OrderFilters,
  OrderPaginatedResponse,
} from '../types/order';
import { FilterProductParams, Product } from '../../products/types/product';
import { PaginatedResponse } from '../../../core/guards/types/paginator';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private readonly productsApiUrl = `${environment.apiUrl}/products`;
  private client = inject(HttpClient);

  // ============================================
  // ORDERS ENDPOINTS
  // ============================================

  createOrder(dto: CreateOrderDto): Observable<Order> {
    return this.client.post<Order>(this.apiUrl, dto);
  }

  getOrders(filters?: OrderFilters): Observable<OrderPaginatedResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.searchName) params = params.set('searchName', filters.searchName);
      if (filters.searchId) params = params.set('searchId', filters.searchId.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.location) params = params.set('location', filters.location);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.table) params = params.set('table', filters.table);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.client.get<OrderPaginatedResponse>(this.apiUrl, { params });
  }

  getOrderById(id: number): Observable<Order> {
    return this.client.get<Order>(`${this.apiUrl}/${id}`);
  }

  updateOrder(id: number, dto: UpdateOrderDto): Observable<Order> {
    return this.client.patch<Order>(`${this.apiUrl}/${id}`, dto);
  }

  deleteOrder(id: number): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/${id}`);
  }

  sendToKitchen(id: number): Observable<{ orderId: number; kitchenSentAt: Date; message: string }> {
    return this.client.post<{ orderId: number; kitchenSentAt: Date; message: string }>(
      `${this.apiUrl}/${id}/send-to-kitchen`,
      {},
    );
  }

  cancelOrder(id: number): Observable<Order> {
    return this.client.patch<Order>(`${this.apiUrl}/${id}/cancel`, {});
  }

  markReady(id: number): Observable<Order> {
    return this.client.patch<Order>(`${this.apiUrl}/${id}/mark-ready`, {});
  }

  finishOrder(id: number): Observable<any> {
    return this.client.post<any>(`${this.apiUrl}/${id}/finish`, {});
  }

  getByCode(code: string): Observable<Product> {
    return this.client.get<Product>(`${this.productsApiUrl}/code/${code}`);
  }

  getAll(
    page: number = 1,
    limit: number = 10,
    filters?: FilterProductParams,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortKey', sortKey)
      .set('sortOrder', sortOrder);

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.productType) params = params.set('productType', filters.productType);
    if (filters?.unit) params = params.set('unit', filters.unit);
    if (filters?.active !== undefined) params = params.set('active', filters.active.toString());
    if (filters?.lowStock !== undefined)
      params = params.set('lowStock', filters.lowStock.toString());
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId.toString());

    return this.client.get<PaginatedResponse<Product>>(this.productsApiUrl, { params });
  }
}
