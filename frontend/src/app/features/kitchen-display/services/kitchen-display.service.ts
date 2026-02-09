import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { KitchenOrder, KitchenOrderItem, ProductionStatus } from '../types/kitchen-display';

@Injectable({
  providedIn: 'root',
})
export class KitchenService {
  private readonly apiUrl = `${environment.apiUrl}/production`;
  private client = inject(HttpClient);

  /**
   * Busca todas as produções e agrupa por pedido
   */
  getKitchenOrders(productionLocation?: string): Observable<KitchenOrder[]> {
    let url = this.apiUrl;

    if (productionLocation && productionLocation !== 'Todas as cozinhas') {
      // Mapeia nome amigável para código do backend
      const locationMap: Record<string, string> = {
        'Cozinha 1': 'LOCAL_01',
        'Cozinha 2': 'LOCAL_02',
        'Cozinha 3': 'LOCAL_03',
      };

      const location = locationMap[productionLocation] || productionLocation;
      url = `${this.apiUrl}/location/${location}`;
    }

    return this.client
      .get<any[]>(url)
      .pipe(map((productions) => this.groupProductionsByOrder(productions)));
  }

  /**
   * Agrupa produções por pedido
   */
  private groupProductionsByOrder(productions: any[]): KitchenOrder[] {
    const ordersMap = new Map<number, KitchenOrder>();

    for (const prod of productions) {
      const orderId = prod.orderItem.order.id;

      if (!ordersMap.has(orderId)) {
        // Criar novo pedido
        ordersMap.set(orderId, {
          orderId: orderId,
          orderNumber: `#${orderId}`,
          table: prod.orderItem.order.table,
          type: prod.orderItem.order.type,
          customerName: prod.orderItem.order.customerName,
          kitchen: this.formatKitchenName(prod.productionLocation),
          items: [],
          status: 'pending',
          createdAt: prod.pendingAt,
          kitchenSentAt: prod.pendingAt,
        });
      }

      // Adicionar item ao pedido
      const order = ordersMap.get(orderId)!;
      order.items.push({
        id: prod.orderItem.id,
        productId: prod.orderItem.product.id,
        name: prod.orderItem.name,
        code: prod.orderItem.code,
        quantity: prod.orderItem.quantity || prod.quantityRequested,
        productionId: prod.id,
        productionStatus: prod.status,
        pendingAt: prod.pendingAt,
        startedAt: prod.startedAt,
        completedAt: prod.completedAt,
        pendingDuration: prod.pendingDuration,
        inProgressDuration: prod.inProgressDuration,
        totalDuration: prod.totalDuration,
      });
    }

    // Calcular status do pedido baseado nos items
    return Array.from(ordersMap.values()).map((order) => ({
      ...order,
      status: this.calculateOrderStatus(order.items),
    }));
  }

  /**
   * Calcula status do pedido baseado nos items
   */
  private calculateOrderStatus(items: KitchenOrderItem[]): 'pending' | 'preparing' | 'ready' {
    const allCompleted = items.every(
      (item) => item.productionStatus === ProductionStatus.COMPLETED,
    );
    const someInProgress = items.some(
      (item) => item.productionStatus === ProductionStatus.IN_PROGRESS,
    );

    if (allCompleted) return 'ready';
    if (someInProgress) return 'preparing';
    return 'pending';
  }

  /**
   * Formata nome da cozinha para exibição
   */
  private formatKitchenName(location: string): string {
    const map: Record<string, string> = {
      LOCAL_01: 'Cozinha 1',
      LOCAL_02: 'Cozinha 2',
      LOCAL_03: 'Cozinha 3',
      DELIVERY: 'Delivery',
    };
    return map[location] || location;
  }

  /**
   * Inicia preparo de um item
   */
  startPreparingItem(productionId: number): Observable<any> {
    return this.client.post(`${this.apiUrl}/${productionId}/start`, {});
  }

  /**
   * Inicia preparo de todos os items de um pedido
   */
  startPreparing(orderId: number, items: KitchenOrderItem[]): Observable<any> {
    // Iniciar todos os items pendentes
    const pendingItems = items.filter((item) => item.productionStatus === ProductionStatus.PENDING);

    // Usar forkJoin para fazer todas as requisições em paralelo
    const requests = pendingItems.map((item) => this.startPreparingItem(item.productionId));

    // Se não houver items pendentes, retornar observable vazio
    if (requests.length === 0) {
      return new Observable((observer) => {
        observer.next({ message: 'Nenhum item pendente para iniciar' });
        observer.complete();
      });
    }

    return this.client.post(`${this.apiUrl}/batch/start`, {
      productionIds: pendingItems.map((item) => item.productionId),
    });
  }

  /**
   * Marca um item como completo
   */
  completeItem(productionId: number): Observable<any> {
    return this.client.post(`${this.apiUrl}/${productionId}/complete`, {});
  }

  /**
   * Marca todos os items de um pedido como completos
   */
  markAsReady(orderId: number, items: KitchenOrderItem[]): Observable<any> {
    const inProgressItems = items.filter(
      (item) => item.productionStatus === ProductionStatus.IN_PROGRESS,
    );

    if (inProgressItems.length === 0) {
      return new Observable((observer) => {
        observer.next({ message: 'Nenhum item em progresso para completar' });
        observer.complete();
      });
    }

    return this.client.post(`${this.apiUrl}/batch/complete`, {
      productionIds: inProgressItems.map((item) => item.productionId),
    });
  }

  /**
   * Marca um item como entregue
   */
  deliverItem(productionId: number): Observable<any> {
    return this.client.post(`${this.apiUrl}/${productionId}/deliver`, {});
  }

  /**
   * Marca todos os items de um pedido como entregues
   */
  markAsDelivered(orderId: number, items: KitchenOrderItem[]): Observable<any> {
    const completedItems = items.filter(
      (item) => item.productionStatus === ProductionStatus.COMPLETED,
    );

    if (completedItems.length === 0) {
      return new Observable((observer) => {
        observer.next({ message: 'Nenhum item completo para entregar' });
        observer.complete();
      });
    }

    return this.client.post(`${this.apiUrl}/batch/deliver`, {
      productionIds: completedItems.map((item) => item.productionId),
    });
  }

  /**
   * Cancela uma produção
   */
  cancelProduction(productionId: number): Observable<any> {
    return this.client.patch(`${this.apiUrl}/${productionId}/cancel`, {});
  }

  /**
   * Cancela todas as produções de um pedido
   */
  cancelOrder(orderId: number, items: KitchenOrderItem[]): Observable<any> {
    const cancelableItems = items.filter(
      (item) => item.productionStatus !== ProductionStatus.COMPLETED,
    );

    if (cancelableItems.length === 0) {
      return new Observable((observer) => {
        observer.next({ message: 'Nenhum item pode ser cancelado' });
        observer.complete();
      });
    }

    return this.client.post(`${this.apiUrl}/batch/cancel`, {
      productionIds: cancelableItems.map((item) => item.productionId),
    });
  }
}
