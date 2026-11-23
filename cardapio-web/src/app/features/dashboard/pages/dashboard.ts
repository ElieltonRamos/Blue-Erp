import { CurrencyPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { Category, Menu, Product } from '../types/dashboard';
import { AboutModal } from '../../../shared/components/about-modal/about-modal';
import { RouterLink } from '@angular/router';
import { CartService } from '../../cart/services/cart.service';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, NgTemplateOutlet, AboutModal, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'dashboard.html',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly document = inject(DOCUMENT);
  private readonly cartService = inject(CartService);

  protected readonly year = new Date().getFullYear();

  protected readonly menu = signal<Menu | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly search = signal('');
  protected readonly activeCategoryId = signal<number | null>(null);

  protected readonly featured = computed(() =>
    (this.menu()?.categories ?? [])
      .flatMap((category) => category.products)
      .filter((product) => product.featured && product.available),
  );

  protected readonly visibleCategories = computed<Category[]>(() => {
    const categories = this.menu()?.categories ?? [];
    const term = normalize(this.search());

    return categories
      .map((category) => ({
        ...category,
        products: term
          ? category.products.filter((product) =>
              normalize(`${product.name} ${product.description ?? ''}`).includes(term),
            )
          : category.products,
      }))
      .filter((category) => category.products.length > 0);
  });

  constructor() {
    this.load();
  }

  protected load() {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getMenu().subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.activeCategoryId.set(menu.categories[0]?.id ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected scrollToCategory(id: number) {
    this.activeCategoryId.set(id);
    this.document
      .getElementById(`category-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected addToCart(product: Product) {
    this.cartService.add(product);
  }
}
