import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ProductReportSummary, productReportMock } from '../../types/reportProducts';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

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
  private companyService = inject(CompanyService);

  report: ProductReportSummary = productReportMock;
  companyData: Company | null = null;
  reportGenerated = false;

  startDate: string = '';
  endDate: string = '';
  isLoading = false;

  ngOnInit() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    this.startDate = now.toISOString().split('T')[0];
    this.endDate = this.startDate;

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

  getTodayFormatted(): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(),
    );
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
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  }

  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    return { high: 'Alta', medium: 'Média', low: 'Baixa' }[priority] ?? priority;
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

    this.reportService.generateReportProducts(this.startDate, this.endDate).subscribe({
      next: (reportData) => {
        this.report = reportData.data;
        this.reportGenerated = true;
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

  print() {
    const content = document.getElementById('reportProductsContent')?.innerHTML;
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

            body {
              font-family: 'IBM Plex Sans', sans-serif;
              font-size: 10pt;
              color: #1a1a2e;
              background: white;
            }

            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2.5px solid #1a1a2e;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .print-header .logo-area { display: flex; align-items: center; gap: 10px; }
            .print-header img { height: 36px; }
            .print-header .company-name { font-size: 15pt; font-weight: 700; color: #1a1a2e; }
            .print-header .company-sub { font-size: 8pt; color: #555; margin-top: 2px; }
            .print-header .report-meta { text-align: right; font-size: 8pt; color: #444; line-height: 1.6; }
            .print-header .report-meta strong { font-size: 10pt; color: #1a1a2e; display: block; margin-bottom: 2px; }

            .section-title {
              font-size: 9pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #1a1a2e;
              border-left: 3px solid #1a1a2e;
              padding-left: 8px;
              margin: 16px 0 10px;
            }

            .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 8px; }
            .kpi-card { border: 1px solid #d8d8e8; border-radius: 4px; padding: 8px 10px; background: #fafafa; }
            .kpi-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.5px; color: #777; margin-bottom: 4px; }
            .kpi-value { font-size: 11pt; font-weight: 700; color: #1a1a2e; }
            .kpi-value.green { color: #1a6b3c; }
            .kpi-value.yellow { color: #7a5c00; }
            .kpi-value.red { color: #8b1a1a; }
            .kpi-value.blue { color: #1a3a6b; }

            .info-box {
              border: 1px solid #c8c8d8;
              border-left: 3px solid #1a1a2e;
              background: #f5f5fa;
              border-radius: 4px;
              padding: 8px 12px;
              font-size: 8pt;
              color: #333;
              line-height: 1.5;
              margin-bottom: 4px;
            }
            .info-box strong { color: #1a1a2e; }

            table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
            thead tr { background: #1a1a2e; color: white; }
            thead th { padding: 5px 8px; text-align: left; font-weight: 600; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.4px; }
            tbody tr:nth-child(even) { background: #f2f2f8; }
            tbody td { padding: 5px 8px; border-bottom: 1px solid #e0e0ec; color: #1a1a2e; }
            tbody td.amount { font-weight: 600; }
            tbody td.red { color: #8b1a1a; font-weight: 600; }
            tbody td.yellow { color: #7a5c00; font-weight: 600; }
            tbody tr.row-red { background: #fff0f0; }
            tbody tr.row-yellow { background: #fffbe6; }

            .badge { padding: 2px 6px; border-radius: 3px; font-size: 7pt; font-weight: 700; }
            .badge-red { background: #fde8e8; color: #8b1a1a; }
            .badge-yellow { background: #fef9e7; color: #7a5c00; }
            .badge-blue { background: #e8f0fe; color: #1a3a6b; }

            .stock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .stock-table-title { font-size: 9pt; font-weight: 700; margin-bottom: 6px; color: #1a1a2e; }

            .print-footer {
              margin-top: 20px;
              padding-top: 8px;
              border-top: 1px solid #ccc;
              display: flex;
              justify-content: space-between;
              font-size: 7pt;
              color: #888;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.addEventListener('load', () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    });
  }
}
