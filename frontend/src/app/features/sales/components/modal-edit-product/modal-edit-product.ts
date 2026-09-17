import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../types/product';

export interface CartProduct extends Product {
  quantity: number;
}

@Component({
  selector: 'app-modal-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalEditProduct implements OnChanges {
  @Input({ required: true }) item!: CartProduct;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<CartProduct>();

  editedItem!: CartProduct;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.editedItem = { ...this.item };
    }
  }

  calculateTotal(): number {
    return parseFloat((this.editedItem.price * this.editedItem.quantity).toFixed(2));
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSave(): void {
    this.save.emit(this.editedItem);
  }
}
