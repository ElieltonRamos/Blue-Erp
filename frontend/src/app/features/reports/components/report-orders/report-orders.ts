import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  OrderReportSummary,
  orderReportMock,
  OrderStatusDB,
  OrderTypeDB,
} from '../../types/reportOrders';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-report-orders',
  imports: [FormsModule],
  templateUrl: './report-orders.html',
})
export class ReportOrders implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  report: OrderReportSummary = orderReportMock;
  startDate: string = '';
  endDate: string = '';
  isLoading = false;

  private expandedLocations = new Set<string>();

  ngOnInit() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    this.startDate = now.toISOString().split('T')[0];
    this.endDate = this.startDate;
  }

  toggleLocation(locationId: string): void {
    if (this.expandedLocations.has(locationId)) {
      this.expandedLocations.delete(locationId);
    } else {
      this.expandedLocations.add(locationId);
    }
  }

  isLocationExpanded(locationId: string): boolean {
    return this.expandedLocations.has(locationId);
  }

  getFullDate(): string {
    if (!this.startDate || !this.endDate) return '';
    const start = new Date(`${this.startDate}T00:00`);
    const end = new Date(`${this.endDate}T00:00`);
    const fmt = new Intl.DateTimeFormat('pt-BR');
    return `${fmt.format(start)} - ${fmt.format(end)}`;
  }

  setToday() {
    this.startDate = this.formatDateInput(new Date());
    this.endDate = this.startDate;
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

  setThisMonth() {
    const today = new Date();
    this.startDate = this.formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
    this.endDate = this.formatDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  }

  formatDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  }

  formatTime(minutes: number | null): string {
    if (!minutes || minutes === 0) return '-';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}min`;
  }

  getStatusLabel(status: OrderStatusDB): string {
    const labels: Record<OrderStatusDB, string> = {
      OPEN: 'Aberto',
      CLOSED: 'Fechado',
      CANCELED: 'Cancelado',
      PAID: 'Pago',
    };
    return labels[status] ?? status;
  }

  getTypeLabel(type: OrderTypeDB): string {
    const labels: Record<OrderTypeDB, string> = {
      DINE_IN: 'Local',
      DELIVERY: 'Delivery',
    };
    return labels[type] ?? type;
  }

  generateReport() {
    if (!this.startDate || !this.endDate) {
      this.notification.error('Por favor, selecione as datas de início e fim.');
      return;
    }
    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.notification.error('A data de início não pode ser maior que a data de fim.');
      return;
    }

    this.isLoading = true;
    this.expandedLocations.clear();

    this.reportService.generateReportOrders(this.startDate, this.endDate).subscribe({
      next: (reportData) => {
        this.report = reportData.data;
      },
      error: (err) => {
        this.notification.error(
          `Erro ao gerar relatório: ${(err.error?.message as string) || 'Erro desconhecido'}`,
        );
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
