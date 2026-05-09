import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateUser } from '../components/create-user/create-user';
import { ListUsers } from '../components/list-users/list-users';
import { ManageProductionLocations } from '../components/manage-production-locations/manage-production-locations';

@Component({
  selector: 'app-users',
  imports: [CreateUser, ListUsers, ManageProductionLocations],
  templateUrl: './users.html',
})
export class Users {
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
