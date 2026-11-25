import { CurrencyPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterRenderEffect, computed, inject, signal, viewChild } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { Category, Menu, Product } from '../types/dashboard';
import { AboutModal } from '../../../shared/components/about-modal/about-modal';
import { RouterLink } from '@angular/router';
import { CartBar } from '../../cart/components/cart-bar';
import { ProductDetail } from '../../../shared/components/product-detail/product-detail';
import { OrderService } from '../../order/services/order.service';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, NgTemplateOutlet, AboutModal, RouterLink, CartBar, ProductDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'dashboard.html',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly document = inject(DOCUMENT);

  private readonly productDetail = viewChild(ProductDetail);

  protected readonly lastOrderId = inject(OrderService).lastOrderId;

  protected readonly year = new Date().getFullYear();

  protected readonly menu = signal<Menu | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly search = signal('');
  protected readonly activeCategoryId = signal<number | null>(null);

  private spyPausedUntil = 0;

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

    // Marca como ativa a primeira categoria que cruza a faixa logo abaixo da barra sticky.
    afterRenderEffect((onCleanup) => {
      const ids = this.visibleCategories().map((category) => category.id);
      if (!ids.length) return;

      const inBand = new Set<number>();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = Number(entry.target.id.replace('category-', ''));
            if (entry.isIntersecting) inBand.add(id);
            else inBand.delete(id);
          }
          if (Date.now() < this.spyPausedUntil) return;

          const active = ids.find((id) => inBand.has(id));
          if (active !== undefined) this.activeCategoryId.set(active);
        },
        { rootMargin: '-80px 0px -60% 0px' },
      );

      for (const id of ids) {
        const section = this.document.getElementById(`category-${id}`);
        if (section) observer.observe(section);
      }
      onCleanup(() => observer.disconnect());
    });

    // Mantém a pill ativa visível no scroll horizontal da barra.
    afterRenderEffect(() => {
      const id = this.activeCategoryId();
      const pill = id === null ? null : this.document.getElementById(`nav-category-${id}`);
      const nav = pill?.closest('nav');
      if (pill && nav) {
        nav.scrollTo({
          left: pill.offsetLeft - (nav.clientWidth - pill.offsetWidth) / 2,
          behavior: 'smooth',
        });
      }
    });
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
    this.spyPausedUntil = Date.now() + 800;
    this.activeCategoryId.set(id);
    this.document
      .getElementById(`category-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected openDetail(product: Product) {
    this.productDetail()?.open(product);
  }
}
