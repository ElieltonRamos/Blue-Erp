import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'cart.html',
})
export class CartPage {
  protected readonly cart = inject(CartService);

  /** Id da linha cuja observação está em edição. */
  protected readonly editingNoteId = signal<string | null>(null);

  protected toggleNote(lineId: string) {
    this.editingNoteId.update((current) => (current === lineId ? null : lineId));
  }

  protected unitPrice(item: CartItem) {
    return this.cart.unitPrice(item);
  }

  protected lineTotal(item: CartItem) {
    return this.cart.lineTotal(item);
  }
}
