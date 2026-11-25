import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { delay, of, tap } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { Menu } from '../types/dashboard';
import { MOCK_MENU } from './dashboard.mock';
import { BrandingService } from '../../../core/services/branding.service';

const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly branding = inject(BrandingService);

  getMenu() {
    const source = USE_MOCK
      ? of(MOCK_MENU).pipe(delay(400))
      : this.http.get<Menu>(`${environment.apiUrl}/public/menu`);
    return source.pipe(tap((menu) => this.branding.apply(menu.store)));
  }
}
