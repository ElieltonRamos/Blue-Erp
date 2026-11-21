import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CategoryNav } from '../../components/category-nav/category-nav';
import { CategorySection } from '../../components/category-section/category-section';
import { FeaturedCarousel } from '../../components/featured-carousel/featured-carousel';
import { MenuFooter } from '../../components/menu-footer/menu-footer';
import { MenuSearch } from '../../components/menu-search/menu-search';
import { StoreHeader } from '../../components/store-header/store-header';
import { Category, Menu } from '../../models/menu.models';
import { MenuService } from '../../services/menu.service';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

@Component({
  selector: 'app-dashboard',
  imports: [StoreHeader, CategoryNav, MenuSearch, FeaturedCarousel, CategorySection, MenuFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly menuService = inject(MenuService);
  private readonly document = inject(DOCUMENT);

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

    this.menuService.getMenu().subscribe({
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
}
