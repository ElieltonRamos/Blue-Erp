import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EditOrderModal } from '../edit-order-modal/edit-order-modal';
import { Order, OrderStatus } from '../../types/order';
import { OrderService } from '../../services/order.service';
import { MockOrderService } from '../../services/order.mock.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';

@Component({
  selector: 'app-list-orders',
  imports: [FormsModule, CommonModule, EditOrderModal],
  templateUrl: './list-orders.html',
})
export class ListOrders implements OnInit {
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  searchName: string = '';
  searchId: string = '';
  statusFilter: string = 'all';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading: boolean = false;

  // Modal state
  isModalOpen: boolean = false;
  selectedOrder: Order | null = null;

  private orderService = inject(MockOrderService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;

    this.orderService
      .getOrders({
        searchName: this.searchName,
        searchId: this.searchId,
        status: this.statusFilter,
        page: this.currentPage,
        limit: this.itemsPerPage,
      })
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar pedidos:', error);
          this.isLoading = false;
        },
      });
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter((order) => {
      const matchesName =
        !this.searchName ||
        order.customerName?.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesId =
        !this.searchId || order.id.toLowerCase().includes(this.searchId.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || order.status === this.statusFilter;
      return matchesName && matchesId && matchesStatus;
    });

    this.totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  getStatusLabel(status: OrderStatus): string {
    const labels = {
      open: 'Aberto',
      closed: 'Fechado',
      canceled: 'Cancelado',
    };
    return labels[status];
  }

  getStatusClass(status: OrderStatus): string {
    const styles = {
      open: 'bg-green-500/20 text-green-400 border border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      canceled: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return styles[status];
  }

  editOrder(orderId: string): void {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      // Criar uma cópia profunda do pedido para edição
      this.selectedOrder = JSON.parse(JSON.stringify(order));
      this.isModalOpen = true;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  onOrderUpdated(updatedOrder: Order): void {
    // Atualizar o pedido na lista
    const index = this.orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
      this.applyFilters();
    }
  }

  async finishOrder(orderId: string): Promise<void> {
    const confirmed = await alertConfirm('Deseja realmente finalizar este pedido?');

    if (confirmed) {
      this.orderService.finishOrder(orderId).subscribe({
        next: (updatedOrder) => {
          this.router.navigate(['/comandas', orderId]);
          this.cdr.detectChanges(); 
        },
        error: (error) => {
          console.error('Erro ao finalizar pedido:', error);
          this.notification.error('Erro ao finalizar pedido. Tente novamente.');
        },
      });
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    const confirmed = await alertConfirm(
      'Deseja realmente cancelar este pedido? Esta ação não pode ser desfeita.',
    );

    if (confirmed) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex((o) => o.id === updatedOrder.id);
          if (index !== -1) {
            this.orders[index] = updatedOrder;
            this.applyFilters();
          }
          this.cdr.detectChanges(); 
        },
        error: (error) => {
          console.error('Erro ao cancelar pedido:', error);
          this.notification.error('Erro ao cancelar pedido. Tente novamente.');
        },
      });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }
}
