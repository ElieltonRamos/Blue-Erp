import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ReportService } from '../../services/report.service';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

@Component({
  selector: 'app-reports-expenses',
  imports: [FormsModule],
  templateUrl: './reports-expenses.html',
})
export class ReportsExpensesComponent {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private cdr = inject(ChangeDetectorRef);
  startDate: string = '';
  endDate: string = '';
  isLoading = false;
  companyData: Company | null = null;
  reportGenerated = false;

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
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyData = company;
        this.cdr.detectChanges();
      },
      error: () => this.notification.error('Erro ao carregar dados da empresa'),
    });
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
        this.reportGenerated = true;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao gerar relatório de despesas: ${e.error.message}`);
        this.isLoading = false;
      },
    });
  }

  getTodayFormatted(): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(),
    );
  }

  print() {
    const content = document.getElementById('reportContent')?.innerHTML;
    if (!content) return;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: A4; margin: 12mm 14mm; }
          body { font-family: 'IBM Plex Sans', sans-serif; font-size: 10pt; color: #1a1a2e; background: white; }
          .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 14px; }
          .print-header img { height: 36px; }
          .company-name { font-size: 15pt; font-weight: 700; color: #1a1a2e; }
          .company-sub { font-size: 8pt; color: #555; margin-top: 2px; }
          .report-meta { text-align: right; font-size: 8pt; color: #444; line-height: 1.6; }
          .report-meta strong { font-size: 10pt; color: #1a1a2e; display: block; margin-bottom: 2px; }
          .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1a1a2e; border-left: 3px solid #1a1a2e; padding-left: 8px; margin: 16px 0 10px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 4px; }
          .kpi-card { border: 1px solid #d8d8e8; border-radius: 4px; padding: 8px 10px; background: #fafafa; }
          .kpi-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #777; margin-bottom: 4px; }
          .kpi-value { font-size: 13pt; font-weight: 700; color: #1a1a2e; }
          .kpi-value.green { color: #1a6b3c; }
          .kpi-value.red { color: #8b1a1a; }
          .kpi-value.yellow { color: #7a6000; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          thead tr { background: #1a1a2e; color: white; }
          thead th { padding: 6px 10px; text-align: left; font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.4px; }
          tbody tr:nth-child(even) { background: #f2f2f8; }
          tbody td { padding: 6px 10px; border-bottom: 1px solid #e0e0ec; color: #1a1a2e; }
          tbody td.amount { font-weight: 600; }
          .print-footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 7pt; color: #888; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);
    doc.close();

    iframe.contentWindow?.addEventListener('load', () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    });
  }
}
