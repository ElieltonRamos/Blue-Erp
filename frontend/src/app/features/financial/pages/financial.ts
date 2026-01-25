import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateExpenses } from '../components/create-expenses/create-expenses';
import { ListExpenses } from '../components/list-expenses/list-expenses';
import { ReportsExpensesComponent } from "../components/reports-expenses/reports-expenses";
import { PromissoryNoteReceivable } from "../components/promissory-note-receivable/promissory-note-receivable";

@Component({
  selector: 'app-financial',
  imports: [CreateExpenses, ListExpenses, ReportsExpensesComponent, PromissoryNoteReceivable],
  templateUrl: './financial.html',
})
export class Financial {
  private router = inject(Router);
  menuContext = 'listExpenses';
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
