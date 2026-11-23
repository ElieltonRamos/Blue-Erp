import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart-bar',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cart.count() > 0) {
      <a
        routerLink="/carrinho"
        class="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between bg-cart-bar px-4 py-3 text-on-dark"
        aria-label="Ver carrinho"
      >
        <span class="relative flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            class="size-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>
          <span
            class="absolute -top-2 left-4 min-w-4.5 rounded-full bg-accent px-1 text-center text-[11px] leading-4.5 font-bold text-on-accent"
          >
            {{ cart.count() }}
          </span>
          <span class="text-lg">Ver carrinho</span>
        </span>

        <span class="text-lg font-medium">
          {{ cart.total() | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}
        </span>
      </a>
    }
  `,
})
export class CartBar {
  protected readonly cart = inject(CartService);
}
