import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import {
  Order,
  OrderStatus,
  CreateOrderDto,
  Product,
  OrderFilters,
  FinishOrderDto,
  Sale,
} from '../types/order';
import Client from '../../clients/types/clients';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  // ==================== ORDERS ====================

  // GET /orders - Lista todos os pedidos com filtros opcionais
  getOrders(filters?: OrderFilters): Observable<Order[]> {
    let params: any = {};

    if (filters) {
      if (filters.searchName) params.customerName = filters.searchName;
      if (filters.searchId) params.id = filters.searchId;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
    }

    return this.client.get<Order[]>(`${this.apiUrl}/orders`, { params });
  }

  // GET /orders/:id - Busca um pedido específico
  getOrderById(orderId: string): Observable<Order> {
    return this.client.get<Order>(`${this.apiUrl}/orders/${orderId}`);
  }

  // POST /orders - Cria um novo pedido
  createOrder(order: CreateOrderDto): Observable<Order> {
    return this.client.post<Order>(`${this.apiUrl}/orders`, order);
  }

  // PUT /orders/:id - Atualiza um pedido
  updateOrder(orderId: string, order: Partial<Order>): Observable<Order> {
    return this.client.put<Order>(`${this.apiUrl}/orders/${orderId}`, order);
  }

  // PATCH /orders/:id/status - Atualiza apenas o status do pedido
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.client.patch<Order>(`${this.apiUrl}/orders/${orderId}/status`, { status });
  }

  // DELETE /orders/:id - Deleta um pedido
  deleteOrder(orderId: string): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/orders/${orderId}`);
  }

  // PATCH /orders/:id/finish - Finaliza um pedido (muda status para 'closed')
  finishOrder(orderId: string): Observable<Order> {
    return this.updateOrderStatus(orderId, 'closed');
  }

  // PATCH /orders/:id/cancel - Cancela um pedido (muda status para 'canceled')
  cancelOrder(orderId: string): Observable<Order> {
    return this.updateOrderStatus(orderId, 'canceled');
  }

  // ==================== PRODUCTS ====================

  // GET /products/search - Busca produtos por código ou nome
  searchProducts(query: { code?: string; name?: string }): Observable<Product[]> {
    let params: any = {};

    if (query.code) params.code = query.code;
    if (query.name) params.name = query.name;

    return this.client.get<Product[]>(`${this.apiUrl}/products/search`, { params });
  }

  // GET /products/:code - Busca produto por código de barras
  getProductByCode(code: string): Observable<Product> {
    return this.client.get<Product>(`${this.apiUrl}/products/code/${code}`);
  }

  // GET /products - Lista todos os produtos
  getProducts(): Observable<Product[]> {
    return this.client.get<Product[]>(`${this.apiUrl}/products`);
  }

  // ==================== SALES ====================

  // POST /sales - Finaliza pedido e cria venda
  finalizeSale(saleData: FinishOrderDto): Observable<Sale> {
    return this.client.post<Sale>(`${this.apiUrl}/sales`, saleData);
  }

  // GET /sales/:id - Busca venda por ID
  getSaleById(saleId: string): Observable<Sale> {
    return this.client.get<Sale>(`${this.apiUrl}/sales/${saleId}`);
  }

  findClientById(id: number) {
    return this.client.get<Client>(`${this.apiUrl}/client/${id}`);
  }

  findClientByName(name: string) {
    return this.client.get<Client[]>(`${this.apiUrl}/client/search/${name}`);
  }
}
