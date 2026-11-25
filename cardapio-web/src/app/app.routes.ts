import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { NotFound } from './shared/components/not-found/not-found';
import { StoreInfoPage } from './features/store-info/pages/store-info';
import { CartPage } from './features/cart/pages/cart';
import { OrderPage } from './features/order/pages/order';
import { CheckoutPage } from './features/checkout/pages/checkout';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'informacoes', component: StoreInfoPage },
  { path: 'carrinho', component: CartPage },
  { path: 'checkout', component: CheckoutPage },
  { path: 'pedido/:id', component: OrderPage },
  { path: '**', component: NotFound },
];
