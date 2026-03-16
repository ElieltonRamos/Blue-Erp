import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ListClients } from "../components/list-clients/list-clients";
import { CreateClient } from "../components/create-client/create-client";

@Component({
  selector: 'app-clients',
  imports: [ListClients, CreateClient],
  templateUrl: './clients.html',
})
export class Clients {
  private router = inject(Router);
  menuContext = 'create';
  classBtnSelected =
    'bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  classBtnUnselected =
    'text-white hover:underline px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';

  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
