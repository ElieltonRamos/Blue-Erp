import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { NotFound } from './shared/components/not-found/not-found';
import { StoreInfoPage } from './features/store-info/pages/store-info';
import { CartPage } from './features/cart/pages/cart';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'informacoes', component: StoreInfoPage },
  { path: 'carrinho', component: CartPage },
  { path: '**', component: NotFound },
];
