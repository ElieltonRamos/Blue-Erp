import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { NotFound } from './shared/components/not-found/not-found';
import { StoreInfoPage } from './features/store-info/pages/store-info';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'informacoes', component: StoreInfoPage },
  { path: '**', component: NotFound },
];
