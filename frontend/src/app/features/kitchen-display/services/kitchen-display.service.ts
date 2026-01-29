import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { KitchenOrder, KitchenOrderStatus, Recipe } from '../types/kitchen-display';

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private apiUrl = environment.apiUrl;
  private client = inject(HttpClient);

  // GET /kitchen/orders - Lista todos os pedidos da cozinha
  getKitchenOrders(): Observable<KitchenOrder[]> {
    return this.client.get<KitchenOrder[]>(`${this.apiUrl}/kitchen/orders`);
  }

  // GET /kitchen/orders/:id - Busca pedido específico
  getKitchenOrderById(id: string): Observable<KitchenOrder> {
    return this.client.get<KitchenOrder>(`${this.apiUrl}/kitchen/orders/${id}`);
  }

  // GET /kitchen/orders/status/:status - Filtra pedidos por status
  getOrdersByStatus(status: KitchenOrderStatus): Observable<KitchenOrder[]> {
    return this.client.get<KitchenOrder[]>(`${this.apiUrl}/kitchen/orders/status/${status}`);
  }

  // PATCH /kitchen/orders/:id/status - Atualiza status do pedido
  updateOrderStatus(orderId: string, status: KitchenOrderStatus): Observable<KitchenOrder> {
    return this.client.patch<KitchenOrder>(`${this.apiUrl}/kitchen/orders/${orderId}/status`, {
      status,
    });
  }

  // PATCH /kitchen/orders/:id/start - Inicia preparo do pedido
  startPreparing(orderId: string): Observable<KitchenOrder> {
    return this.updateOrderStatus(orderId, 'preparing');
  }

  // PATCH /kitchen/orders/:id/ready - Marca pedido como pronto
  markAsReady(orderId: string): Observable<KitchenOrder> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  // PATCH /kitchen/orders/:id/deliver - Marca pedido como entregue
  markAsDelivered(orderId: string): Observable<KitchenOrder> {
    return this.updateOrderStatus(orderId, 'delivered');
  }

  // GET /kitchen/recipes/:productId - Busca receita de um produto
  getRecipe(productId: string): Observable<Recipe> {
    return this.client.get<Recipe>(`${this.apiUrl}/kitchen/recipes/${productId}`);
  }

  // DELETE /kitchen/orders/:id - Remove pedido (apenas para testes/admin)
  deleteOrder(orderId: string): Observable<void> {
    return this.client.delete<void>(`${this.apiUrl}/kitchen/orders/${orderId}`);
  }
}