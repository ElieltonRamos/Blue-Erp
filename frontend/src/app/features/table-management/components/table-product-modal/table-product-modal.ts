import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, OrderItem } from '../../types/table';
import { OrderService } from '../../../orders/services/order.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

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
  isSaving = false;
  searchResults: any[] = [];

  get items(): OrderItem[] {
    return this.table.order?.items || [];
  }

  get orderTotal(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  get hasInvalidObservations(): boolean {
    return this.items.some((item) => !item.observation || item.observation.trim().length < 2);
  }

  searchByCode(): void {
    if (!this.searchCode.trim()) return;

    this.isSearching = true;
    this.orderService.getByCode(this.searchCode).subscribe({
      next: (product) => {
        this.addProduct(product.id, product.code, product.name, Number(product.price));
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
    this.addProduct(product.id, product.code, product.name, Number(product.price));
    this.searchResults = [];
    this.searchName = '';
    select.selectedIndex = 0;
  }

  private addProduct(productId: number, code: string, name: string, unitPrice: number): void {
    if (!this.table.order) return;

    const existingItem = this.table.order.items.find((i) => i.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
      this.notification.success('Quantidade atualizada');
    } else {
      this.table.order.items.push({
        id: 0,
        productId,
        code,
        name,
        quantity: 1,
        unitPrice,
        total: unitPrice,
        observation: '',
      });
      this.notification.success('Produto adicionado');
    }

    this.table.order.total = this.orderTotal;
    this.cdr.markForCheck();
  }

  updateQuantity(item: OrderItem, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    item.quantity = newQuantity;
    item.total = item.quantity * item.unitPrice;
    if (this.table.order) {
      this.table.order.total = this.orderTotal;
    }
    this.cdr.markForCheck();
  }

  removeItem(item: OrderItem): void {
    if (!this.table.order) return;
    this.table.order.items = this.table.order.items.filter((i) => i !== item);
    this.table.order.total = this.orderTotal;
    this.cdr.markForCheck();
  }

  onClose(): void {
    if (this.hasInvalidObservations) {
      this.notification.error('Preencha a observação de todos os itens (mínimo 2 caracteres)');
      return;
    }

    if (!this.table.order) {
      this.close.emit();
      return;
    }

    this.isSaving = true;
    const orderId = this.table.order.id;

    const updateDto = {
      items: this.table.order.items.map((item) => ({
        ...(item.id && item.id > 0 ? { id: item.id } : {}),
        productId: item.productId,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        observation: item.observation,
      })),
      total: this.orderTotal,
    };

    this.orderService.updateOrder(orderId, updateDto).subscribe({
      next: (updatedOrder) => {
        if (this.table.order) {
          this.table.order.items = updatedOrder.items.map((i) => ({
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
        this.isSaving = false;
        this.searchCode = '';
        this.searchName = '';
        this.searchResults = [];
        this.updated.emit();
        this.close.emit();
        this.cdr.markForCheck();
        this.notification.success("Atualizado!")
      },
      error: (error) => {
        this.notification.error(`Erro ao salvar: ${error.error?.message || error.message}`);
        this.isSaving = false;
        this.cdr.markForCheck();
      },
    });
  }
}
