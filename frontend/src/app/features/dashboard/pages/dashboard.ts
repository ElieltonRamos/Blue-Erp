// dashboard.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CardMenu } from '../components/card-menu/card-menu';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DashboardService } from '../services/dashboard.service';
import { AutoClosedOrder } from '../types/auto-closed-order';
import { LicenseService } from '../../../core/services/license.service';

type Role = 'admin' | 'caixa' | 'garcom' | 'cozinheiro';
const PRO_ONLY_ROUTES = ['/fiscal'];

const PERMISSIONS: Record<string, Role[]> = {
  '/clientes': ['admin', 'caixa'],
  '/comandas': ['admin', 'caixa', 'garcom'],
  '/cozinha': ['admin', 'cozinheiro'],
  '/mesas': ['admin', 'caixa', 'garcom'],
  '/produtos': ['admin'],
  '/usuarios': ['admin'],
  '/historico-vendas': ['admin', 'caixa'],
  '/relatorios': ['admin', 'caixa'],
  '/financeiro': ['admin', 'caixa'],
  '/empresa': ['admin'],
  '/fiscal': ['admin'],
};

@Component({
  selector: 'app-dashboard',
  imports: [CardMenu],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private dashboardService = inject(DashboardService);
  private licenseService = inject(LicenseService);
  themeService = inject(ThemeService);

  userName: string = '';
  role: Role = 'garcom';
  autoClosedOrders = signal<AutoClosedOrder[]>([]);
  closedWithoutPayment = signal<AutoClosedOrder[]>([]);
  bannerDismissed = signal(false);
  subscriptionOverdue = signal(false);

  autoClosedIds = computed(() =>
    this.autoClosedOrders()
      .map((o) => o.id)
      .join(', '),
  );
  closedWithoutPaymentIds = computed(() =>
    this.closedWithoutPayment()
      .map((o) => o.id)
      .join(', '),
  );

  ngOnInit() {
    const payload = this.auth.getTokenPayload();

    if (!payload) {
      this.notification.warning('Sessão inválida');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return;
    }

    this.userName = payload.username;
    this.role = (payload.role as Role) || 'garcom';

    if (this.canAccess('/financeiro')) {
      this.dashboardService.getAutoClosedOrders().subscribe({
        next: (orders) => this.autoClosedOrders.set(orders),
        error: () => this.autoClosedOrders.set([]),
      });

      this.dashboardService.getClosedWithoutPayment().subscribe({
        next: (orders) => this.closedWithoutPayment.set(orders),
        error: () => this.closedWithoutPayment.set([]),
      });
    }

    this.licenseService.getTokenInfo().subscribe({
      next: (info) => {
        this.subscriptionOverdue.set(info.licenseValidUntil < Date.now());
      },
      error: () => this.subscriptionOverdue.set(false),
    });
  }

  get hasWarnings(): boolean {
    return (
      this.autoClosedOrders().length > 0 ||
      this.closedWithoutPayment().length > 0 ||
      this.subscriptionOverdue()
    );
  }

  dismissBanner() {
    this.bannerDismissed.set(true);
  }

  logout() {
    localStorage.removeItem('token');
    this.notification.info('Logout realizado');
    this.router.navigate(['/']);
  }

  canAccess(path: string): boolean {
    const hasRole = PERMISSIONS[path]?.includes(this.role) ?? false;
    if (!hasRole) return false;

    if (PRO_ONLY_ROUTES.includes(path)) {
      return this.licenseService.getCurrentPlan() === 'pro';
    }

    return true;
  }
}
