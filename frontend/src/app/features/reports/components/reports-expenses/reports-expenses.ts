import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports-expenses',
  imports: [FormsModule],
  templateUrl: './reports-expenses.html',
})
export class ReportsExpensesComponent {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  startDate: string = '';
  endDate: string = '';
  isLoading = false;

  report = {
    totalValue: 0,
    totalByStatus: {
      pago: 0,
      pendente: 0,
      atrasado: 0,
    },
    totalBySupplier: [] as { supplier: string; total: number }[],
  };

  ngOnInit() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const localDate = now.toISOString().split('T')[0];

    this.startDate = localDate;
    this.endDate = localDate;
  }

  getFullDate(): string {
    if (!this.startDate || !this.endDate) return '';

    const start = new Date(`${this.startDate}T00:00`);
    const end = new Date(`${this.endDate}T00:00`);
    const formatter = new Intl.DateTimeFormat('pt-BR');

    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  setToday() {
    const today = new Date().toISOString().slice(0, 10);
    this.startDate = today;
    this.endDate = today;
  }

  setThisMonth() {
    const today = new Date();
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    this.endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
  }

  async generateReport() {
    this.isLoading = true;
    this.reportService.getExpensesReport(this.startDate, this.endDate).subscribe({
      next: (response) => {
        this.report = response.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao gerar relatório de despesas: ${e.error.message}`);
        this.isLoading = false;
      },
    });
  }
}
