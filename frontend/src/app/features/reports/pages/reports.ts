import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReportSales } from "../components/report-sales/report-sales";

@Component({
  selector: 'app-reports',
  imports: [ReportSales],
  templateUrl: './reports.html',
})
export class Reports {
  private router = inject(Router);
  menuContext = 'report-sales';
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
