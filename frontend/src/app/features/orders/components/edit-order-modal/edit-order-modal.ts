import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-edit-order-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-order-modal.html',
})
export class EditOrderModal {
  @Input() isOpen: boolean = false;
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<Order>();

  isSaving: boolean = false;
  private orderService = inject(OrderService);

  onTypeChange(): void {
    if (this.order && this.order.type === 'delivery') {
      this.order.table = undefined;
    }
  }

  addItem(): void {
    if (!this.order) return;

    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };

    this.order.items.push(newItem);
  }

  removeItem(index: number): void {
    if (!this.order) return;
    this.order.items.splice(index, 1);
    this.calculateOrderTotal();
  }

  calculateItemTotal(item: OrderItem): void {
    item.total = item.quantity * item.unitPrice;
    this.calculateOrderTotal();
  }

  calculateOrderTotal(): void {
    if (!this.order) return;
    this.order.total = this.order.items.reduce((sum, item) => sum + item.total, 0);
  }

  saveOrder(): void {
    if (!this.order || this.isSaving) return;

    this.isSaving = true;

    this.orderService.updateOrder(this.order.id, this.order).subscribe({
      next: (updatedOrder) => {
        this.isSaving = false;
        this.orderUpdated.emit(updatedOrder);
        this.closeModal();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erro ao atualizar pedido:', error);
        alert('Erro ao atualizar pedido. Tente novamente.');
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}