import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ListClients } from '../components/list-clients/list-clients';
import { CreateClient } from '../components/create-client/create-client';

@Component({
  selector: 'app-clients',
  imports: [ListClients, CreateClient],
  templateUrl: './clients.html',
})
export class Clients {
  private router = inject(Router);
  menuContext = 'create';

  classBtnSelected =
    'bg-accent hover:bg-accent-hover text-btn-text px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md';

  classBtnUnselected =
    'text-text-secondary hover:text-text-primary hover:bg-surface-alt px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all';
  
  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
