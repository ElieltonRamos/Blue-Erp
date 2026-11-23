import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { delay, of } from 'rxjs';
import { environment } from '../../../core/services/environment';
import { Menu } from '../types/dashboard';
import { MOCK_MENU } from './dashboard.mock';

const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getMenu() {
    if (USE_MOCK) {
      return of(MOCK_MENU).pipe(delay(400));
    }
    return this.http.get<Menu>(`${environment.apiUrl}/public/menu`);
  }
}
