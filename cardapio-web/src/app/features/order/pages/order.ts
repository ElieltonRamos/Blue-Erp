import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { OrderService } from '../services/order.service';
import { StoreInfo } from '../../store-info/types/store';
import { Order, OrderStatus } from '../types/oprder';

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Pedido recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  ready_for_pickup: 'Pronto para retirada',
  completed: 'Pedido concluído',
  canceled: 'Pedido cancelado',
};

@Component({
  selector: 'app-order',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'order.html',
})
export class OrderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly order = signal<Order | null>(null);
  protected readonly store = signal<StoreInfo | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly statusLabel = computed(() => {
    const order = this.order();
    return order ? STATUS_LABELS[order.status] : '';
  });

  /** Abre a conversa com a loja já com uma mensagem sobre o pedido. */
  protected readonly whatsappUrl = computed(() => {
    const order = this.order();
    const store = this.store();
    if (!order || !store) return null;

    const message = `Olá! Fiz o pedido #${order.id} em nome de ${order.customer.name}.`;
    return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    forkJoin({ order: this.orderService.get(id), menu: this.dashboardService.getMenu() }).subscribe(
      {
        next: ({ order, menu }) => {
          if (order.status === 'completed' || order.status === 'canceled') {
            this.orderService.forgetOrder();
          }
          this.order.set(order);
          this.store.set(menu.store);
          this.loading.set(false);
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.orderService.forgetOrder();
          }
          this.error.set(true);
          this.loading.set(false);
        },
      },
    );
  }
}
