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

export const routes: Routes = [
  {
    path: '',
    component: Login,
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
];
