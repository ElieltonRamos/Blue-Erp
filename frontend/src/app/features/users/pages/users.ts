import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateUser } from "../components/create-user/create-user";
import { ListUsers } from "../components/list-users/list-users";

@Component({
  selector: 'app-users',
  imports: [CreateUser, ListUsers],
  templateUrl: './users.html',
})
export class Users {
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
