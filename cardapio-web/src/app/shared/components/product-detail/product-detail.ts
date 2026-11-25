import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CartItem, CartSelection, CartService } from '../../../features/cart/services/cart.service';
import { StoreInfo } from '../../../features/store-info/types/store';
import { OptionGroup, Product, Option } from '../../../features/dashboard/types/dashboard';

const OBSERVATION_MAX_LENGTH = 100;

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'product-detail.html',
})
export class ProductDetail {
  private readonly cart = inject(CartService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  /**
   * Loja usada para validar o horário ao adicionar um item novo.
   * Sem loja, a validação não é feita (ex.: edição no carrinho).
   */
  readonly store = input<StoreInfo | null>(null);

  protected readonly observationMaxLength = OBSERVATION_MAX_LENGTH;

  protected readonly product = signal<Product | null>(null);
  protected readonly quantity = signal(1);
  protected readonly observation = signal('');
  /** Quantidade escolhida por opção: optionId → quantidade. */
  protected readonly selected = signal<Record<number, number>>({});
  /** Linha do carrinho em edição. null = adicionando um item novo. */
  protected readonly editingLineId = signal<string | null>(null);
  protected readonly closedNotice = signal(false);

  /** Todos os grupos respeitam mínimo e máximo. */
  protected readonly valid = computed(() =>
    (this.product()?.optionGroups ?? []).every((group) => this.groupValid(group)),
  );

  /** Preço de uma unidade: preço base + opções escolhidas. */
  protected readonly unitPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;

    const extras = product.optionGroups
      .flatMap((group) => group.options)
      .reduce((sum, option) => sum + option.price * this.qty(option.id), 0);

    return product.price + extras;
  });

  protected readonly total = computed(() => this.unitPrice() * this.quantity());

  /** Em produtos "A partir de", o preço só é confiável depois de montar o item. */
  protected readonly showPrice = computed(
    () => this.valid() || this.product()?.startingPrice === null,
  );

  /** Sem `line`, adiciona um item novo. Com `line`, edita aquela linha do carrinho. */
  open(product: Product, line?: CartItem) {
    this.product.set(product);
    this.closedNotice.set(false);
    this.editingLineId.set(line?.lineId ?? null);
    this.quantity.set(line?.quantity ?? 1);
    this.observation.set(line?.observation ?? '');
    this.selected.set(
      Object.fromEntries((line?.selections ?? []).map((item) => [item.optionId, item.quantity])),
    );
    this.dialog().nativeElement.showModal();
    this.scroller()?.nativeElement.scrollTo({ top: 0 });
  }

  close() {
    this.dialog().nativeElement.close();
  }

  protected qty(optionId: number) {
    return this.selected()[optionId] ?? 0;
  }

  protected groupCount(group: OptionGroup) {
    return group.options.reduce((sum, option) => sum + this.qty(option.id), 0);
  }

  protected groupValid(group: OptionGroup) {
    const count = this.groupCount(group);
    return count >= group.min && (group.max === null || count <= group.max);
  }

  protected canIncrement(group: OptionGroup, option: Option) {
    if (!option.available) return false;
    if (group.max !== null && this.groupCount(group) >= group.max) return false;
    return group.maxPerOption === null || this.qty(option.id) < group.maxPerOption;
  }

  /** Grupo `single`: escolhe uma opção (e, se for opcional, permite desmarcar). */
  protected selectSingle(group: OptionGroup, option: Option) {
    if (!option.available) return;

    this.selected.update((current) => {
      const next = { ...current };
      const wasSelected = (next[option.id] ?? 0) > 0;

      for (const item of group.options) {
        delete next[item.id];
      }
      if (!(wasSelected && group.min === 0)) {
        next[option.id] = 1;
      }
      return next;
    });
  }

  /** Grupo `multiple`: soma ou subtrai uma unidade da opção. */
  protected adjust(group: OptionGroup, option: Option, delta: 1 | -1) {
    if (delta === 1 && !this.canIncrement(group, option)) return;

    this.selected.update((current) => {
      const next = { ...current };
      const value = (next[option.id] ?? 0) + delta;

      if (value > 0) {
        next[option.id] = value;
      } else {
        delete next[option.id];
      }
      return next;
    });
  }

  protected changeQuantity(delta: 1 | -1) {
    this.quantity.update((value) => Math.max(1, value + delta));
  }

  protected add() {
    const product = this.product();
    if (!product || !this.valid()) return;

    const editingLineId = this.editingLineId();
    const store = this.store();
    if (!editingLineId && store && !store.isOpen) {
      this.closedNotice.set(true);
      return;
    }

    const selections: CartSelection[] = product.optionGroups.flatMap((group) =>
      group.options
        .filter((option) => this.qty(option.id) > 0)
        .map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          name: option.name,
          price: option.price,
          quantity: this.qty(option.id),
        })),
    );

    const input = {
      product,
      selections,
      quantity: this.quantity(),
      observation: this.observation().trim(),
    };

    if (editingLineId) {
      this.cart.replace(editingLineId, input);
    } else {
      this.cart.add(input);
    }
    this.close();
  }
}
