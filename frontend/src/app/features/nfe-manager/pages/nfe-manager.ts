import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { reportNfe } from './report-nfe/report-nfe';
import { FiscalNotes } from './fiscal-notes/fiscal-notes';

@Component({
  selector: 'app-nfe-manager',
  imports: [reportNfe, FiscalNotes],
  templateUrl: './nfe-manager.html',
})
export class NfeManager {
  private router = inject(Router);

  menuContext = 'fiscal-notes';

  classBtnSelected =
    'bg-accent hover:bg-accent-hover text-btn-text px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  classBtnUnselected =
    'text-text-primary hover:underline px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';

  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
