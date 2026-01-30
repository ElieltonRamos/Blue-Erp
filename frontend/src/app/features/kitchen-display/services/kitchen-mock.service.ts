// mock-kitchen.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  KitchenOrder,
  KitchenOrderStatus,
  Recipe,
  KitchenOrderItem,
} from '../types/kitchen-display';

@Injectable({
  providedIn: 'root',
})
export class MockKitchenService {
  private readonly STORAGE_KEY = 'mock_kitchen_orders';
  private ordersSubject = new BehaviorSubject<KitchenOrder[]>([]);
  private orders: KitchenOrder[] = [];

  constructor() {
    this.loadOrders();
    this.ordersSubject.next(this.orders);
  }

  private loadOrders(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.orders = JSON.parse(stored) as KitchenOrder[];
      } catch {
        this.orders = this.generateInitialOrders();
        this.saveOrders();
      }
    } else {
      this.orders = this.generateInitialOrders();
      this.saveOrders();
    }
  }

  private saveOrders(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.orders));
    this.ordersSubject.next(this.orders);
  }

  private generateInitialOrders(): KitchenOrder[] {
    const now = new Date().toISOString();
    return [
      {
        id: '1',
        orderNumber: '001',
        table: 'Mesa 5',
        type: 'dine_in',
        customerName: 'João Silva',
        items: [
          {
            id: 'item1',
            productId: 'burger1',
            name: 'Cheeseburger',
            quantity: 2,
            notes: 'Sem cebola',
          },
          {
            id: 'item2',
            productId: 'fries1',
            name: 'Batata Frita',
            quantity: 1,
          },
        ],
        status: 'pending' as KitchenOrderStatus,
        createdAt: now,
      },
      {
        id: '2',
        orderNumber: '002',
        type: 'delivery',
        customerName: 'Maria Oliveira',
        items: [
          {
            id: 'item3',
            productId: 'pizza1',
            name: 'Pizza Margherita',
            quantity: 1,
          },
        ],
        status: 'preparing' as KitchenOrderStatus,
        createdAt: new Date(Date.now() - 600000).toISOString(), // 10 min atrás
        startedAt: new Date().toISOString(),
      },
    ];
  }

  // GET /kitchen/orders - Lista todos os pedidos da cozinha
  getKitchenOrders(): Observable<KitchenOrder[]> {
    return this.ordersSubject.asObservable().pipe(delay(300));
  }

  // GET /kitchen/orders/:id - Busca pedido específico
  getKitchenOrderById(id: string): Observable<KitchenOrder> {
    const order = this.orders.find((o) => o.id === id);
    return of(order || this.generateMockOrder(id)).pipe(delay(200));
  }

  // GET /kitchen/orders/status/:status - Filtra pedidos por status
  getOrdersByStatus(status: KitchenOrderStatus): Observable<KitchenOrder[]> {
    const filtered = this.orders.filter((order) => order.status === status);
    return of(filtered).pipe(delay(250));
  }

  updateOrderStatus(orderId: string, status: KitchenOrderStatus): Observable<KitchenOrder> {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Pedido não encontrado');
    }

    const updatedOrder: KitchenOrder = { ...this.orders[orderIndex] };
    updatedOrder.status = status;

    // controla timestamps conforme o status
    switch (status) {
      case 'preparing':
        if (!updatedOrder.startedAt) {
          updatedOrder.startedAt = new Date().toISOString();
        }
        break;

      case 'ready':
        if (!updatedOrder.readyAt) {
          updatedOrder.readyAt = new Date().toISOString();
        }
        break;

      case 'delivered':
        if (!updatedOrder.deliveredAt) {
          updatedOrder.deliveredAt = new Date().toISOString();
        }
        break;

      case 'pending':
      default:
        // não seta timestamp para pending
        break;
    }

    this.orders[orderIndex] = updatedOrder;
    this.saveOrders();

    return of(updatedOrder).pipe(delay(400));
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
    const recipes: Record<string, Recipe> = {
      burger1: {
        title: 'Cheeseburger',
        prepTime: '8 minutos',
        ingredients: [
          'Pão brioche',
          'Hambúrguer 160g',
          'Queijo cheddar',
          'Alface',
          'Tomate',
          'Maionese',
        ],
        steps: [
          'Grelhe o hambúrguer por 3 min cada lado',
          'Monte com queijo derretido',
          'Adicione vegetais frescos',
          'Finalize com maionese',
        ],
      },
      fries1: {
        title: 'Batata Frita',
        prepTime: '5 minutos',
        ingredients: ['Batata asterix', 'Óleo quente'],
        steps: ['Corte em palitos', 'Frite por 3-4 minutos', 'Escorra e tempere'],
      },
      pizza1: {
        title: 'Pizza Margherita',
        prepTime: '12 minutos',
        ingredients: ['Massa pré-assada', 'Molho de tomate', 'Mussarela', 'Manjericão', 'Azeite'],
        steps: [
          'Espalhe molho uniformemente',
          'Adicione mussarela fatiada',
          'Asse a 250°C por 8 minutos',
          'Finalize com manjericão fresco',
        ],
      },
    };

    const recipe = recipes[productId] || {
      title: 'Receita Padrão',
      prepTime: '10 minutos',
      ingredients: ['Ingrediente 1', 'Ingrediente 2'],
      steps: ['Passo 1', 'Passo 2'],
    };

    return of(recipe).pipe(delay(150));
  }

  // DELETE /kitchen/orders/:id - Remove pedido (apenas para testes/admin)
  deleteOrder(orderId: string): Observable<void> {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex !== -1) {
      this.orders.splice(orderIndex, 1);
      this.saveOrders();
    }
    return of(void 0).pipe(delay(200));
  }

  // Método auxiliar para gerar timestamp baseado no status
  private getTimestampField(status: KitchenOrderStatus): string {
    switch (status) {
      case 'preparing':
        return 'startedAt';
      case 'ready':
        return 'readyAt';
      case 'delivered':
        return 'deliveredAt';
      default:
        return '';
    }
  }

  // Método auxiliar para gerar pedido mock
  private generateMockOrder(id: string): KitchenOrder {
    return {
      id,
      orderNumber: `00${parseInt(id)}`,
      type: 'dine_in' as const,
      items: [],
      status: 'pending' as KitchenOrderStatus,
      createdAt: new Date().toISOString(),
    };
  }

  // Método para resetar dados (útil para testes)
  resetOrders(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.orders = this.generateInitialOrders();
    this.saveOrders();
  }
}
