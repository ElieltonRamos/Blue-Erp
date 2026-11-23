import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../../dashboard/types/dashboard';
import { CartItem } from '../types/cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);

  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  add(product: Product) {
    this.items.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...items, { product, quantity: 1, observation: '' }];
    });
  }

  increment(productId: number) {
    this.items.update((items) =>
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  /** Com quantidade 1, remove o item do carrinho. */
  decrement(productId: number) {
    this.items.update((items) =>
      items
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  setObservation(productId: number, observation: string) {
    this.items.update((items) =>
      items.map((item) => (item.product.id === productId ? { ...item, observation } : item)),
    );
  }

  clear() {
    this.items.set([]);
  }
}
