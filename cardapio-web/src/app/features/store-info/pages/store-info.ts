import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { StoreInfo } from '../types/store';

type TabId = 'about' | 'hours' | 'payment';

@Component({
  selector: 'app-store-info',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'store-info.html',
})
export class StoreInfoPage {
  private readonly dashboardService = inject(DashboardService);

  protected readonly tabs: { id: TabId; label: string }[] = [
    { id: 'about', label: 'Sobre' },
    { id: 'hours', label: 'Horários' },
    { id: 'payment', label: 'Pagamento' },
  ];

  protected readonly store = signal<StoreInfo | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly activeTab = signal<TabId>('about');

  constructor() {
    this.load();
  }

  protected load() {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getMenu().subscribe({
      next: (menu) => {
        this.store.set(menu.store);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected mapUrl(store: StoreInfo) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }
}
