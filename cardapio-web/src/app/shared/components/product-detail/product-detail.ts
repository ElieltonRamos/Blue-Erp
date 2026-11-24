import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { Product, Option, OptionGroup } from '../../../features/dashboard/types/dashboard';
import { CartService, CartSelection, AddToCartInput } from '../../../features/cart/services/cart.service';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'product-detail.html',
})
export class ProductDetail {
  private readonly cartService = inject(CartService);

  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly product = signal<Product | null>(null);
  protected readonly quantity = signal(1);
  protected readonly observation = signal('');
  protected readonly selectedOptions = signal<Map<number, number>>(new Map());
  protected readonly observationMaxLength = 100;

  protected readonly showPrice = computed(() => this.product()?.startingPrice === null);

  protected readonly unitPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;
    let price = product.price;
    this.selectedOptions().forEach((qty, optionId) => {
      const option = this.findOption(product, optionId);
      if (option) {
        price += option.price * qty;
      }
    });
    return price;
  });

  protected readonly total = computed(() => this.unitPrice() * this.quantity());

  protected readonly valid = computed(() => {
    const product = this.product();
    if (!product) return false;
    for (const group of product.optionGroups) {
      let count = 0;
      for (const option of group.options) {
        count += this.qty(option.id);
      }
      if (count < group.min) return false;
      if (group.max !== null && count > group.max) return false;
    }
    return true;
  });

  protected findOption(product: Product, optionId: number): Option | undefined {
    for (const group of product.optionGroups) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) return option;
    }
    return undefined;
  }

  protected groupCount(group: OptionGroup): number {
    let count = 0;
    for (const option of group.options) {
      count += this.qty(option.id);
    }
    return count;
  }

  protected qty(optionId: number): number {
    return this.selectedOptions().get(optionId) ?? 0;
  }

  protected canIncrement(group: OptionGroup, option: Option): boolean {
    if (!option.available) return false;

    const currentGroupCount = this.groupCount(group);
    if (group.max !== null && currentGroupCount >= group.max) return false;

    const currentOptionQty = this.qty(option.id);
    if (group.maxPerOption !== null && currentOptionQty >= group.maxPerOption) return false;

    return true;
  }

  protected selectSingle(group: OptionGroup, option: Option): void {
    if (!option.available) return;

    this.selectedOptions.update((map) => {
      const newMap = new Map(map);
      const currentQty = newMap.get(option.id) ?? 0;

      if (group.min === 0 && currentQty > 0) {
        newMap.delete(option.id);
      } else {
        newMap.set(option.id, 1);
        for (const opt of group.options) {
          if (opt.id !== option.id) {
            newMap.delete(opt.id);
          }
        }
      }
      return newMap;
    });
  }

  protected adjust(group: OptionGroup, option: Option, delta: number): void {
    if (!option.available) return;
    if (delta > 0 && !this.canIncrement(group, option)) return;

    this.selectedOptions.update((map) => {
      const newMap = new Map(map);
      const currentQty = newMap.get(option.id) ?? 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        newMap.delete(option.id);
      } else {
        newMap.set(option.id, newQty);
      }
      return newMap;
    });
  }

  protected changeQuantity(delta: number): void {
    this.quantity.update((q) => Math.max(1, q + delta));
  }

  open(product: Product): void {
    this.product.set(product);
    this.quantity.set(1);
    this.observation.set('');
    this.selectedOptions.set(new Map());
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.product.set(null);
    this.quantity.set(1);
    this.observation.set('');
    this.selectedOptions.set(new Map());
  }

  protected add(): void {
    const product = this.product();
    if (!product || !this.valid()) return;

    const selections: CartSelection[] = [];
    this.selectedOptions().forEach((qty, optionId) => {
      if (qty > 0) {
        const option = this.findOption(product, optionId);
        if (option) {
          const group = product.optionGroups.find((g) => g.options.some((o) => o.id === optionId));
          if (group) {
            selections.push({
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              name: option.name,
              price: option.price,
              quantity: qty,
            });
          }
        }
      }
    });

    const input: AddToCartInput = {
      product,
      selections,
      quantity: this.quantity(),
      observation: this.observation(),
    };

    this.cartService.add(input);
    this.close();
  }
}