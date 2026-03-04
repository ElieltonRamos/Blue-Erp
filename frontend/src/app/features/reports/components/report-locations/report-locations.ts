import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import {
  LocationReportData,
  LocationReportLocation,
  locationReportMock,
} from '../../types/reportLocations';

@Component({
  selector: 'app-report-locations',
  imports: [FormsModule],
  templateUrl: './report-locations.html',
})
export class ReportLocations {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  report: LocationReportData = locationReportMock;

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

  setThisWeek() {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - now.getDay() + 1);
    this.startDate = this.formatDate(mon);
    this.endDate = this.formatDate(now);
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
    if (this.isLoading) return;
    this.isLoading = true;

    this.reportService.generateReportLocations(this.startDate, this.endDate).subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.report = response.data;
        } else {
          this.notification.error(response.message ?? 'Erro ao gerar relatório');
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.error(err?.error?.message ?? 'Erro inesperado ao gerar relatório');
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Monta a matriz: { soldAt -> { producedAt -> value } }
  getMatrix(): { matrix: Record<string, Record<string, number>>; productionLocations: string[] } {
    const productionLocations = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};

    this.report.locations.forEach((loc) => {
      matrix[loc.name] = {};
      loc.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          productionLocations.add(item.producedAt);
          matrix[loc.name][item.producedAt] = (matrix[loc.name][item.producedAt] ?? 0) + item.value;
        });
      });
    });

    return { matrix, productionLocations: Array.from(productionLocations) };
  }

  getMatrixValue(
    matrix: Record<string, Record<string, number>>,
    locationName: string,
    producedAt: string,
  ): number {
    return matrix[locationName]?.[producedAt] ?? 0;
  }

  getRowTotal(
    matrix: Record<string, Record<string, number>>,
    locationName: string,
    productionLocations: string[],
  ): number {
    return productionLocations.reduce((s, p) => s + (matrix[locationName]?.[p] ?? 0), 0);
  }

  getColTotal(matrix: Record<string, Record<string, number>>, producedAt: string): number {
    return this.report.locations.reduce((s, loc) => s + (matrix[loc.name]?.[producedAt] ?? 0), 0);
  }

  getGrandTotal(
    matrix: Record<string, Record<string, number>>,
    productionLocations: string[],
  ): number {
    return this.report.locations.reduce(
      (s, loc) => s + productionLocations.reduce((ss, p) => ss + (matrix[loc.name]?.[p] ?? 0), 0),
      0,
    );
  }

  getMaxMatrixValue(
    matrix: Record<string, Record<string, number>>,
    productionLocations: string[],
  ): number {
    const values = this.report.locations.flatMap((loc) =>
      productionLocations.map((p) => matrix[loc.name]?.[p] ?? 0),
    );
    return Math.max(...values, 1);
  }

  getTotalValue(): number {
    return this.report.locations.reduce((s, l) => s + l.totalValue, 0);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  toggleCategory(locationId: number, categoryName: string) {
    const key = `${locationId}-${categoryName}`;
    this.openCategories[key] = !this.openCategories[key];
  }

  isCategoryOpen(locationId: number, categoryName: string): boolean {
    const key = `${locationId}-${categoryName}`;
    return this.openCategories[key] !== false; // aberto por padrão
  }

  private openCategories: Record<string, boolean> = {};
}
