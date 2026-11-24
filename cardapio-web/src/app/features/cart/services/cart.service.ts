import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../../dashboard/types/dashboard';

/** Opção escolhida pelo cliente, já com nome e preço "congelados" no momento da escolha. */
export interface CartSelection {
  groupId: number;
  groupName: string;
  optionId: number;
  name: string;
  /** Preço unitário da opção. */
  price: number;
  quantity: number;
}

export interface CartItem {
  /** Identifica a linha do carrinho (o mesmo produto pode aparecer em várias linhas). */
  lineId: string;
  product: Product;
  selections: CartSelection[];
  quantity: number;
  observation: string;
}

export interface AddToCartInput {
  product: Product;
  selections?: CartSelection[];
  quantity?: number;
  observation?: string;
}

/** Preço de uma unidade do item: preço base + opções escolhidas. */
export const unitPrice = (item: Pick<CartItem, 'product' | 'selections'>) =>
  item.product.price +
  item.selections.reduce((sum, selection) => sum + selection.price * selection.quantity, 0);

/** Total da linha: preço unitário × quantidade. */
export const lineTotal = (item: CartItem) => unitPrice(item) * item.quantity;

/** Duas adições com a mesma assinatura viram a mesma linha. */
const signature = (input: Required<AddToCartInput>) =>
  [
    input.product.id,
    input.selections
      .map((selection) => `${selection.optionId}:${selection.quantity}`)
      .sort()
      .join(','),
    input.observation.trim(),
  ].join('|');

@Injectable({ providedIn: 'root' })
export class CartService {
  private nextLineId = 1;

  readonly items = signal<CartItem[]>([]);

  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  readonly total = computed(() => this.items().reduce((sum, item) => sum + lineTotal(item), 0));

  readonly unitPrice = unitPrice;
  readonly lineTotal = lineTotal;

  add(input: AddToCartInput) {
    const normalized: Required<AddToCartInput> = {
      product: input.product,
      selections: input.selections ?? [],
      quantity: input.quantity ?? 1,
      observation: input.observation ?? '',
    };
    const key = signature(normalized);

    this.items.update((items) => {
      const existing = items.find((item) => signature(item) === key);

      if (existing) {
        return items.map((item) =>
          item.lineId === existing.lineId
            ? { ...item, quantity: item.quantity + normalized.quantity }
            : item,
        );
      }

      return [...items, { lineId: String(this.nextLineId++), ...normalized }];
    });
  }

  increment(lineId: string) {
    this.items.update((items) =>
      items.map((item) =>
        item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  /** Com quantidade 1, remove a linha do carrinho. */
  decrement(lineId: string) {
    this.items.update((items) =>
      items
        .map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  setObservation(lineId: string, observation: string) {
    this.items.update((items) =>
      items.map((item) => (item.lineId === lineId ? { ...item, observation } : item)),
    );
  }

  clear() {
    this.items.set([]);
  }
}
