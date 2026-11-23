import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'cart.html',
})
export class CartPage {
  protected readonly cart = inject(CartService);

  /** Id do produto cuja observação está em edição. */
  protected readonly editingNoteId = signal<number | null>(null);

  protected toggleNote(productId: number) {
    this.editingNoteId.update((current) => (current === productId ? null : productId));
  }
}
