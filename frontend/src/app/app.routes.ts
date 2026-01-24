import { Routes } from '@angular/router';
import { Login } from './features/login/pages/login';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { authGuard } from './core/guards/auth.guard';

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
];
