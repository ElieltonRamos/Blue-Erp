import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: '**', component: NotFound },
];
