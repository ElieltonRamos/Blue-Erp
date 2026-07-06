import { Routes } from '@angular/router';
import { Login } from './features/login/pages/login';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { Clients } from './features/clients/pages/clients';
import { Users } from './features/users/pages/users';
import { Products } from './features/products/pages/products';
import { SalesHistory } from './features/sales/pages/sales-history/sales-history';
import { Company } from './features/company/pages/company';
import { Reports } from './features/reports/pages/reports';
import { Financial } from './features/financial/pages/financial';
import { TableManagement } from './features/table-management/pages/table-management';
import { Orders } from './features/orders/pages/orders/orders';
import { CloseOrder } from './features/orders/pages/close-order/close-order';
import { KitchenDisplay } from './features/kitchen-display/pages/kitchen-display/kitchen-display';
import { NfeManager } from './features/nfe-manager/pages/nfe-manager';
import { offlineGuard } from './core/guards/offline.guard';
import { OfflineComponent } from './features/offline/pages/offline.component';
import { NotFound } from './features/offline/pages/not-found';

export const routes: Routes = [
  {
    path: '',
    component: Login,
    canActivate: [offlineGuard],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: 'clientes',
    component: Clients,
    canActivate: [authGuard],
  },
  {
    path: 'usuarios',
    component: Users,
    canActivate: [authGuard],
  },
  {
    path: 'produtos',
    component: Products,
    canActivate: [authGuard],
  },
  {
    path: 'historico-vendas',
    component: SalesHistory,
    canActivate: [authGuard],
  },
  {
    path: 'empresa',
    component: Company,
    canActivate: [authGuard],
  },
  {
    path: 'relatorios',
    component: Reports,
    canActivate: [authGuard],
  },
  {
    path: 'financeiro',
    component: Financial,
    canActivate: [authGuard],
  },
  {
    path: 'mesas',
    component: TableManagement,
    canActivate: [authGuard],
  },
  {
    path: 'comandas',
    component: Orders,
    canActivate: [authGuard],
  },
  {
    path: 'comandas/:id',
    component: CloseOrder,
    canActivate: [authGuard],
  },
  {
    path: 'cozinha',
    component: KitchenDisplay,
    canActivate: [authGuard],
  },
  {
    path: 'fiscal',
    component: NfeManager,
    canActivate: [authGuard],
  },
  {
    path: 'offline',
    component: OfflineComponent,
  },
  {
    path: '**',
    component: NotFound,
  },
];
