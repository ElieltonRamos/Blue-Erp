import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ReportSales } from '../components/report-sales/report-sales';
import { ReportProducts } from '../components/report-products/report-products';
import { ReportsExpensesComponent } from '../components/reports-expenses/reports-expenses';
import { ReportOrders } from '../components/report-orders/report-orders';
import { ReportLocations } from '../components/report-locations/report-locations';
import { CompanyService } from '../../company/services/company.service';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { ReportWorkshop } from '../components/report-workshop/report-workshop';

@Component({
  selector: 'app-reports',
  imports: [ReportSales, ReportProducts, ReportsExpensesComponent, ReportOrders, ReportLocations, ReportWorkshop],
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  menuContext = 'report-sales';
  businessType: string | null = null;

  classBtnSelected =
    'bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  classBtnUnselected =
    'text-text-secondary hover:text-text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';

  ngOnInit(): void {
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.businessType = company.businessType;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao carregar dados da empresa');
      },
    });
  }

  showRestaurantReports(): boolean {
    return this.businessType === 'RESTAURANTE';
  }

  showWorkshopReports(): boolean {
    return this.businessType === 'OFICINA';
  }

  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
