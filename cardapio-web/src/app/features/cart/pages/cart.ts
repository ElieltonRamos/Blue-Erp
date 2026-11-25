import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from '../services/cart.service';
import { ProductDetail } from '../../../shared/components/product-detail/product-detail';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink, ProductDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'cart.html',
})
export class CartPage {
  protected readonly cart = inject(CartService);

  /** Id da linha cuja observação está em edição. */
  protected readonly editingNoteId = signal<string | null>(null);

  private readonly productDetail = viewChild(ProductDetail);

  protected edit(item: CartItem) {
    this.productDetail()?.open(item.product, item);
  }

  protected toggleNote(lineId: string) {
    this.editingNoteId.update((current) => (current === lineId ? null : lineId));
  }
}
