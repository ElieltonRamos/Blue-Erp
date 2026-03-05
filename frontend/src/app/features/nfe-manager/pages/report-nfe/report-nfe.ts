import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FiscalService } from '../../services/fiscal.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { RevenueReport } from '../../types/fiscal';

@Component({
  selector: 'app-report-nfe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-nfe.html',
})
export class reportNfe implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private fiscalService = inject(FiscalService);
  private notification = inject(NotificationService);

  filterForm = new FormGroup({
    month: new FormControl<string>(this.currentMonth()),
    year: new FormControl<string>(this.currentYear()),
  });

  report: RevenueReport | null = null;
  loading = false;
  exporting = false;

  monthOptions = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  yearOptions: string[] = [];

  ngOnInit(): void {
    this.buildYearOptions();
    this.loadReport();
  }

  private buildYearOptions(): void {
    const current = new Date().getFullYear();
    for (let y = current; y >= current - 5; y--) {
      this.yearOptions.push(y.toString());
    }
  }

  loadReport(): void {
    const { month, year } = this.filterForm.value;
    if (!month || !year) return;

    this.loading = true;
    this.report = null;

    this.fiscalService.getRevenueReport(month, year).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.notification.error(
          `Erro ao carregar relatório: ${e.error?.message ?? 'Erro desconhecido'}`,
        );
        this.cdr.detectChanges();
      },
    });
  }

  exportCsv(): void {
    const { month, year } = this.filterForm.value;
    if (!month || !year) return;

    this.exporting = true;
    this.fiscalService.exportCsv(month, year).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `relatorio-fiscal-${year}-${month}.csv`);
        this.exporting = false;
      },
      error: (e) => {
        this.exporting = false;
        this.notification.error(`Erro ao exportar CSV: ${e.error?.message ?? 'Erro desconhecido'}`);
      },
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private currentMonth(): string {
    return (new Date().getMonth() + 1).toString().padStart(2, '0');
  }

  private currentYear(): string {
    return new Date().getFullYear().toString();
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  get selectedPeriodLabel(): string {
    const { month, year } = this.filterForm.value;
    const m = this.monthOptions.find((o) => o.value === month);
    return `${m?.label ?? ''} / ${year}`;
  }

  get cfopTotalCount(): number {
    return this.report?.byCfop.reduce((acc, r) => acc + r.count, 0) ?? 0;
  }

  get cfopTotalValue(): number {
    return this.report?.byCfop.reduce((acc, r) => acc + r.totalValue, 0) ?? 0;
  }

  get ncmTotalCount(): number {
    return this.report?.byNcm.reduce((acc, r) => acc + r.count, 0) ?? 0;
  }

  get ncmTotalValue(): number {
    return this.report?.byNcm.reduce((acc, r) => acc + r.totalValue, 0) ?? 0;
  }
}
