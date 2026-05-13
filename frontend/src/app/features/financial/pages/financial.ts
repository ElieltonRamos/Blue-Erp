import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateExpenses } from '../components/create-expenses/create-expenses';
import { ListExpenses } from '../components/list-expenses/list-expenses';
import { PromissoryNoteReceivable } from "../components/promissory-note-receivable/promissory-note-receivable";

@Component({
  selector: 'app-financial',
  imports: [CreateExpenses, ListExpenses, PromissoryNoteReceivable],
  templateUrl: './financial.html',
})
export class Financial {
  private router = inject(Router);
  menuContext = 'listExpenses';
  
  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
