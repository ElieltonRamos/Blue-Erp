import { Routes } from '@angular/router';
import { Login } from './features/login/pages/login';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { Clients } from './features/clients/pages/clients';
import { Users } from './features/users/pages/users';

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
];
