import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, OrderItem } from '../../types/table';
import { OrderService } from '../../../orders/services/order.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

interface PendingItem {
  productId: number;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  observation: string;
}

@Component({
  selector: 'app-table-product-modal',
  templateUrl: './table-product-modal.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TableProductModal {
  @Input() show = false;
  @Input() table!: Table;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private orderService = inject(OrderService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  searchCode = '';
  searchName = '';
  isSearching = false;
  searchResults: any[] = [];

  pendingItem: PendingItem | null = null;
  isSavingItem = false;

  get items(): OrderItem[] {
    return this.table.order?.items || [];
  }

  get orderTotal(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  // ---------- Product search ----------

  searchByCode(): void {
    if (!this.searchCode.trim()) return;

    this.isSearching = true;
    this.orderService.getByCode(this.searchCode).subscribe({
      next: (product) => {
        this.openPendingItem(product.id, product.code, product.name, Number(product.price));
        this.searchCode = '';
        this.isSearching = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Produto não encontrado');
        this.isSearching = false;
        this.cdr.markForCheck();
      },
    });
  }

  searchByName(): void {
    if (!this.searchName.trim()) return;

    this.isSearching = true;
    this.orderService.getAll(1, 10, { search: this.searchName }).subscribe({
      next: (response) => {
        this.searchResults = response.data || [];
        if (this.searchResults.length === 0) {
          this.notification.error('Nenhum produto encontrado');
        }
        this.isSearching = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Erro ao buscar produto');
        this.searchResults = [];
        this.isSearching = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectSearchResult(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const index = parseInt(select.value);
    if (isNaN(index) || index < 0) return;

    const product = this.searchResults[index];
    this.openPendingItem(product.id, product.code, product.name, Number(product.price));
    this.searchResults = [];
    this.searchName = '';
    select.selectedIndex = 0;
  }

  // ---------- Pending item (new product or quantity increase) ----------

  private openPendingItem(productId: number, code: string, name: string, unitPrice: number): void {
    this.pendingItem = { productId, code, name, unitPrice, quantity: 1, observation: '' };
  }

  openPendingIncrease(item: OrderItem): void {
    this.pendingItem = {
      productId: item.productId,
      code: item.code,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: 1,
      observation: '',
    };
  }

  cancelPendingItem(): void {
    this.pendingItem = null;
  }

  confirmPendingItem(): void {
    if (!this.table.order || !this.pendingItem || this.isSavingItem) return;

    if (!this.pendingItem.observation || this.pendingItem.observation.trim().length < 2) {
      this.notification.error('Observação obrigatória (mínimo 2 caracteres)');
      return;
    }

    this.isSavingItem = true;

    const dto = {
      items: [
        {
          productId: this.pendingItem.productId,
          code: this.pendingItem.code,
          name: this.pendingItem.name,
          quantity: this.pendingItem.quantity,
          unitPrice: this.pendingItem.unitPrice,
          observation: this.pendingItem.observation,
        },
      ],
    };

    this.orderService.addItems(this.table.order.id, dto).subscribe({
      next: (updatedOrder) => this.onItemsMutated(updatedOrder, 'Produto adicionado'),
      error: (error) => this.onItemMutationError(error),
    });
  }

  // ---------- Quantity decrease / remove ----------

  decreaseQuantity(item: OrderItem): void {
    if (!this.table.order || this.isSavingItem) return;
    this.isSavingItem = true;

    const dto = { items: [{ id: item.id, quantity: 1 }] };

    this.orderService.removeItems(this.table.order.id, dto).subscribe({
      next: (updatedOrder) => this.onItemsMutated(updatedOrder, 'Item atualizado'),
      error: (error) => this.onItemMutationError(error),
    });
  }

  removeItem(item: OrderItem): void {
    if (!this.table.order || this.isSavingItem) return;
    this.isSavingItem = true;

    const dto = { items: [{ id: item.id, quantity: item.quantity }] };

    this.orderService.removeItems(this.table.order.id, dto).subscribe({
      next: (updatedOrder) => this.onItemsMutated(updatedOrder, 'Item removido'),
      error: (error) => this.onItemMutationError(error),
    });
  }

  private onItemsMutated(updatedOrder: any, successMsg: string): void {
    if (this.table.order) {
      this.table.order.items = updatedOrder.items.map((i: any) => ({
        id: Number(i.id),
        productId: i.productId,
        code: i.code,
        name: i.name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
        observation: i.observation ?? '',
      }));
      this.table.order.total = Number(updatedOrder.total);
    }

    this.pendingItem = null;
    this.isSavingItem = false;
    this.notification.success(successMsg);

    this.pushServiceCharge();

    this.updated.emit();
    this.cdr.markForCheck();
  }

  private onItemMutationError(error: any): void {
    this.isSavingItem = false;
    this.notification.error(`Erro: ${error.error?.message || error.message}`);
    this.cdr.markForCheck();
  }

  // ---------- Service charge (automático, sem toggle neste modal) ----------

  private pushServiceCharge(): void {
    if (!this.table.order) return;

    const currentCharge = this.table.order.serviceCharge ?? 0;
    if (currentCharge === 0) {
      return;
    }

    const dto = { enabled: true, amount: parseFloat((this.orderTotal * 0.1).toFixed(2)) };

    this.orderService.updateServiceCharge(this.table.order.id, dto).subscribe({
      next: (updatedOrder) => {
        if (this.table.order) {
          this.table.order.serviceCharge = Number(updatedOrder.serviceCharge ?? 0);
          this.table.order.total = Number(updatedOrder.total);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao atualizar taxa: ${error.error?.message || error.message}`);
        this.cdr.markForCheck();
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
