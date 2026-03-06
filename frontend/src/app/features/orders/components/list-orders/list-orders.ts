import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EditOrderModal } from '../edit-order-modal/edit-order-modal';
import { Order, OrderStatus } from '../../types/order';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { OrderService } from '../../services/order.service';
import { ModalOrderNote } from '../modal-order-note/modal-order-note';

@Component({
  selector: 'app-list-orders',
  imports: [FormsModule, CommonModule, EditOrderModal, ModalOrderNote],
  templateUrl: './list-orders.html',
})
export class ListOrders implements OnInit {
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private orderService = inject(OrderService);
  private router = inject(Router);

  searchName: string = '';
  searchId: string = '';
  statusFilter: string = 'all';
  locationFilter: string = 'all';
  startDate: string = '';
  endDate: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalOrders: number = 0;
  isPrintModalOpen: boolean = false;
  selectedOrderForPrint: Order | null = null;

  orders: Order[] = [];
  isLoading: boolean = false;

  isModalOpen: boolean = false;
  selectedOrder: Order | null = null;

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadOrders();
  }

  private setDefaultDates(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    this.startDate = `${year}-${month}-${day}`;
    this.endDate = `${year}-${month}-${day}`;
  }

  loadOrders(): void {
    this.isLoading = true;

    this.orderService
      .getOrders({
        searchName: this.searchName || undefined,
        searchId: this.searchId ? parseInt(this.searchId) : undefined,
        status: this.statusFilter !== 'all' ? (this.statusFilter as OrderStatus) : undefined,
        location: this.locationFilter !== 'all' ? (this.locationFilter as any) : undefined,
        startDate: this.startDate || undefined,
        endDate: this.endDate || undefined,
        page: this.currentPage,
        limit: this.itemsPerPage,
      })
      .subscribe({
        next: (response) => {
          this.orders = response.data;
          this.totalOrders = response.total;
          this.totalPages = response.totalPages;
          this.isLoading = false;
          console.log(response.data);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar pedidos:', error);
          this.notification.error('Erro ao carregar pedidos');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchName = '';
    this.searchId = '';
    this.statusFilter = 'all';
    this.locationFilter = 'all';
    this.setDefaultDates();
    this.currentPage = 1;
    this.loadOrders();
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      OPEN: 'Aberto',
      CLOSED: 'Fechado',
      CANCELED: 'Cancelado',
      PAID: 'Pago',
    };
    return labels[status];
  }

  getStatusClass(status: OrderStatus): string {
    const styles: Record<OrderStatus, string> = {
      OPEN: 'bg-green-500/20 text-green-400 border border-green-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      PAID: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      CANCELED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return styles[status];
  }

  getLocationLabel(locationId: string): string {
    const labels: Record<string, string> = {
      LOCAL_01: 'Local 01',
      LOCAL_02: 'Local 02',
      LOCAL_03: 'Local 03',
      DELIVERY: 'Delivery',
    };
    return labels[locationId] || locationId;
  }

  getTypeLabel(type: string): string {
    return type === 'DINE_IN' ? 'Mesa' : 'Entrega';
  }

  editOrder(orderId: number): void {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      this.selectedOrder = JSON.parse(JSON.stringify(order));
      this.isModalOpen = true;
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  onOrderUpdated(updatedOrder: Order): void {
    const index = this.orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
    }
    this.notification.success('Pedido atualizado com sucesso');
    this.cdr.detectChanges();
  }

  async finishOrder(orderId: number): Promise<void> {
    const confirmed = await alertConfirm('Deseja realmente fechar este pedido?');

    if (confirmed) {
      this.orderService.updateOrder(orderId, { status: 'CLOSED' }).subscribe({
        next: () => {
          this.notification.success('Pedido fechado com sucesso');
          this.router.navigate(['/comandas', orderId]);
          this.loadOrders();
        },
        error: (error) => {
          console.error('Erro ao fechar pedido:', error);
          this.notification.error('Erro ao fechar pedido');
        },
      });
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    const confirmed = await alertConfirm('Deseja realmente cancelar este pedido?');

    if (confirmed) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.notification.success('Pedido cancelado com sucesso');
          this.loadOrders();
        },
        error: (error) => {
          console.error('Erro ao cancelar pedido:', error);
          this.notification.error('Erro ao cancelar pedido');
        },
      });
    }
  }

  printOrder(orderId: number): void {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      this.selectedOrderForPrint = order;
      this.isPrintModalOpen = true;
    }
  }

  closePrintModal(): void {
    this.isPrintModalOpen = false;
    this.selectedOrderForPrint = null;
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
