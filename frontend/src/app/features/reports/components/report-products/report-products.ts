import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ProductReportSummary, productReportMock } from '../../types/reportProducts';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-report-products',
  imports: [FormsModule],
  templateUrl: './report-products.html',
})
export class ReportProducts {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  report: ProductReportSummary = productReportMock;

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
    this.startDate = this.formatDateInput(today);
    this.endDate = this.formatDateInput(today);
  }

  setThisMonth() {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.startDate = this.formatDateInput(first);
    this.endDate = this.formatDateInput(last);
  }

  formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    const labels = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    };
    return labels[priority] || priority;
  }

  generateReport() {
    if (!this.startDate || !this.endDate) {
      this.notification.error('Por favor, selecione as datas de início e fim.');
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      this.notification.error('A data de início não pode ser maior que a data de fim.');
      return;
    }

    this.isLoading = true;

    // Chamar serviço que busca os dados do relatório de produtos
    this.reportService.generateReportProducts(this.startDate, this.endDate).subscribe({
      next: (reportData) => {
        this.report = reportData.data;
      },
      error: (err) => {
        this.notification.error(
          `Erro ao gerar relatório: ${err.error?.message || 'Erro desconhecido'}`,
        );
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
