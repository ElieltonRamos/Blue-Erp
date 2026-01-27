// services/order.mock.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderType = 'dine_in' | 'delivery';
export type OrderStatus = 'open' | 'closed' | 'canceled';

export interface Order {
  id: string;
  type: OrderType;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  customerName?: string;
  table?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderMockService {
  private orders: Order[] = [
    {
      id: '1',
      type: 'dine_in',
      items: [
        { id: 'i1', name: 'Hambúrguer Clássico', quantity: 2, unitPrice: 25.00, total: 50.00 },
        { id: 'i2', name: 'Batata Frita', quantity: 1, unitPrice: 15.00, total: 15.00 },
      ],
      status: 'open',
      total: 65.00,
      table: 'Mesa 5',
    },
    {
      id: '2',
      type: 'delivery',
      items: [
        { id: 'i3', name: 'Pizza Margherita', quantity: 1, unitPrice: 45.00, total: 45.00 },
      ],
      status: 'closed',
      total: 45.00,
      customerName: 'João Silva',
    },
  ];

  getOrders(): Observable<Order[]> {
    return of([...this.orders]).pipe(delay(500));
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return of(this.orders.find(order => order.id === id)).pipe(delay(300));
  }

  createOrder(orderData: Omit<Order, 'id' | 'items'>): Observable<Order> {
    const newOrder: Order = {
      id: Date.now().toString(),
      ...orderData,
      items: [], // Inicialmente vazio
    };
    this.orders.unshift(newOrder);
    return of(newOrder).pipe(delay(800));
  }

  updateOrder(id: string, orderData: Partial<Order>): Observable<Order> {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex !== -1) {
      this.orders[orderIndex] = { ...this.orders[orderIndex], ...orderData };
      return of(this.orders[orderIndex]).pipe(delay(600));
    }
    throw new Error('Pedido não encontrado');
  }

  deleteOrder(id: string): Observable<void> {
    this.orders = this.orders.filter(order => order.id !== id);
    return of(void 0).pipe(delay(400));
  }
}
