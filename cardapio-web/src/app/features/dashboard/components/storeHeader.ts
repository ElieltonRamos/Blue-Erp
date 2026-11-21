import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StoreInfo } from '../../models/menu.models';

@Component({
  selector: 'app-store-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mx-3 mt-5 rounded-lg border border-border bg-surface shadow-header">
      <h1 class="px-4 pt-3 text-base font-semibold text-text-primary">{{ store().name }}</h1>

      <div class="flex flex-col gap-1 px-4 pt-2 pb-3 text-xs text-text-secondary">
        <p>{{ store().address }}</p>

        <p class="flex items-center gap-2">
          <span>{{ store().openingHours }}</span>
          <span
            class="inline-flex items-center gap-1.5"
            [class.text-success]="store().isOpen"
            [class.text-danger]="!store().isOpen"
          >
            <span
              class="size-2.5 rounded-full"
              [class.bg-success]="store().isOpen"
              [class.bg-danger]="!store().isOpen"
            ></span>
            {{ store().isOpen ? 'Aberto' : 'Fechado' }}
          </span>
        </p>

        <p class="flex flex-wrap gap-x-3">
          <span>Entrega: {{ store().deliveryTime }}</span>
          <span>Retirada: {{ store().takeoutTime }}</span>
        </p>
      </div>
    </header>
  `,
})
export class StoreHeader {
  readonly store = input.required<StoreInfo>();
}
