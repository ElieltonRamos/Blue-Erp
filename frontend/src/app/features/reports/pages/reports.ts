import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReportSales } from '../components/report-sales/report-sales';
import { ReportProducts } from '../components/report-products/report-products';
import { ReportsExpensesComponent } from '../components/reports-expenses/reports-expenses';
import { ReportOrders } from '../components/report-orders/report-orders';
import { ReportLocations } from '../components/report-locations/report-locations';

@Component({
  selector: 'app-reports',
  imports: [ReportSales, ReportProducts, ReportsExpensesComponent, ReportOrders, ReportLocations],
  templateUrl: './reports.html',
})
export class Reports {
  private router = inject(Router);
  menuContext = 'report-sales';
  classBtnSelected =
    'bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  classBtnUnselected =
    'text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
