import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { SalesReportSummary, summaryMock } from '../../types/reportsSales';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-report-sales',
  imports: [FormsModule],
  templateUrl: './report-sales.html',
})
export class ReportSales {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  report: SalesReportSummary = summaryMock;

  startDate: string = '';
  endDate: string = '';
  isLoading = false;

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

  setToday() {
    const today = new Date();
    this.startDate = this.formatDate(today);
    this.endDate = this.formatDate(today);
  }

  setThisMonth() {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.startDate = this.formatDate(first);
    this.endDate = this.formatDate(last);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generateReport() {
    this.isLoading = true;
    // Chamar serviço que busca os dados e exibe ou exporta
    this.reportService.generateReportSales(this.startDate, this.endDate).subscribe({
      next: (reportData) => {
        this.report = reportData;
      },
      error: (err) => {
        this.notification.error(`Erro ao gerar relatório: ${err.error.message}`);
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
