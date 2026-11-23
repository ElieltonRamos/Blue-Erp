import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/pages/dashboard';
import { NotFound } from './shared/components/not-found/not-found';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: '**', component: NotFound },
];
