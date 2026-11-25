import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { Order, OrderItem, OrderRequest } from '../types/oprder';
import { MOCK_MENU } from '../../dashboard/services/dashboard.mock';

const USE_MOCK = true;

/** Único dado guardado no navegador: o id do último pedido (o carrinho não é persistido). */
const LAST_ORDER_KEY = 'cardapio-web:last-order';
const LAST_ORDER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly mockOrders = new Map<string, Order>();

  /** Id do último pedido feito neste navegador (para o atalho "Acompanhar pedido"). */
  readonly lastOrderId = signal<string | null>(this.readLastOrderId());

  create(request: OrderRequest): Observable<Order> {
    const source = USE_MOCK
      ? of(this.createMock(request)).pipe(delay(600))
      : this.http.post<Order>(`${environment.apiUrl}/public/orders`, request);

    return source.pipe(tap((order) => this.rememberOrder(order.id)));
  }

  get(id: string): Observable<Order> {
    if (USE_MOCK) {
      const order = this.mockOrders.get(id);
      return order
        ? of(order).pipe(delay(300))
        : throwError(() => new HttpErrorResponse({ status: 404 }));
    }
    return this.http.get<Order>(`${environment.apiUrl}/public/orders/${id}`);
  }

  /** Esquece o pedido guardado (pedido finalizado ou inexistente). */
  forgetOrder() {
    this.lastOrderId.set(null);
    try {
      localStorage.removeItem(LAST_ORDER_KEY);
    } catch {
      // armazenamento indisponível: o atalho some só nesta sessão
    }
  }

  private rememberOrder(id: string) {
    this.lastOrderId.set(id);
    try {
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ id, savedAt: Date.now() }));
    } catch {
      // armazenamento indisponível: o atalho vale só nesta sessão
    }
  }

  private readLastOrderId(): string | null {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) ?? 'null');
      const fresh = saved && Date.now() - Number(saved.savedAt) < LAST_ORDER_MAX_AGE_MS;
      return fresh && typeof saved.id === 'string' ? saved.id : null;
    } catch {
      return null;
    }
  }

  /** Simula o backend: resolve nomes e preços a partir do MOCK_MENU. */
  private createMock(request: OrderRequest): Order {
    const products = MOCK_MENU.categories.flatMap((category) => category.products);

    const items: OrderItem[] = request.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const options = product.optionGroups.flatMap((group) => group.options);

      const selections = item.selections.map((selection) => ({
        option: options.find((o) => o.id === selection.optionId)!,
        quantity: selection.quantity,
      }));

      const unit =
        product.price + selections.reduce((sum, s) => sum + s.option.price * s.quantity, 0);

      return {
        name: product.name,
        quantity: item.quantity,
        observation: item.observation,
        selections: selections.map((s) => ({ name: s.option.name, quantity: s.quantity })),
        total: unit * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const deliveryFee = request.fulfillment === 'delivery' ? MOCK_MENU.store.deliveryFee : 0;
    const payment = MOCK_MENU.store.paymentMethods.find((m) => m.type === request.payment.type)!;

    const order: Order = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'received',
      createdAt: new Date().toISOString(),
      fulfillment: request.fulfillment,
      customer: request.customer,
      address: request.address,
      payment: { ...request.payment, label: payment.label },
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
    };

    this.mockOrders.set(order.id, order);
    return order;
  }
}
