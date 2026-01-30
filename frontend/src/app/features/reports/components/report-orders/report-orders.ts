import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { OrderReportSummary, orderReportMock } from '../../types/reportOrders';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-report-orders',
  imports: [FormsModule],
  templateUrl: './report-orders.html',
})
export class ReportOrders {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  
  report: OrderReportSummary = orderReportMock;

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

  setThisWeek() {
    const today = new Date();
    const first = new Date(today);
    first.setDate(today.getDate() - today.getDay());
    const last = new Date(today);
    last.setDate(today.getDate() + (6 - today.getDay()));
    this.startDate = this.formatDateInput(first);
    this.endDate = this.formatDateInput(last);
  }

  formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(date);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00`);
    const formatter = new Intl.DateTimeFormat('pt-BR');
    return formatter.format(date);
  }

  getStatusLabel(status: 'pending' | 'preparing' | 'ready' | 'delivered'): string {
    const labels = {
      pending: 'Pendente',
      preparing: 'Preparando',
      ready: 'Pronto',
      delivered: 'Entregue',
    };
    return labels[status] || status;
  }

  getTypeLabel(type: 'dine_in' | 'delivery'): string {
    const labels = {
      dine_in: 'Local',
      delivery: 'Delivery',
    };
    return labels[type] || type;
  }

  formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
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

    // Chamar serviço que busca os dados do relatório de pedidos
    this.reportService.generateReportOrders(this.startDate, this.endDate).subscribe({
      next: (reportData) => {
        this.report = reportData;
      },
      error: (err) => {
        this.notification.error(`Erro ao gerar relatório: ${err.error?.message || 'Erro desconhecido'}`);
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}