import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { SalesReportSummary, summaryMock } from '../../types/reportsSales';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

@Component({
  selector: 'app-report-sales',
  imports: [FormsModule],
  templateUrl: './report-sales.html',
})
export class ReportSales implements OnInit {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private companyService = inject(CompanyService);

  report: SalesReportSummary = summaryMock;
  companyData: Company | null = null;
  reportGenerated = false;
  today = new Date();

  startDate: string = '';
  endDate: string = '';
  isLoading = false;

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

  getTodayFormatted(): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(),
    );
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
    if (this.isLoading) return;
    this.isLoading = true;

    this.reportService.generateReportSales(this.startDate, this.endDate).subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.report = response.data;
          this.reportGenerated = true;
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

            @page {
              size: A4;
              margin: 12mm 14mm;
            }

            body {
              font-family: 'IBM Plex Sans', sans-serif;
              font-size: 10pt;
              color: #1a1a2e;
              background: white;
            }

            /* Header */
            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2.5px solid #1a1a2e;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .print-header .logo-area {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .print-header img {
              height: 36px;
            }
            .print-header .company-name {
              font-size: 15pt;
              font-weight: 700;
              letter-spacing: -0.3px;
              color: #1a1a2e;
            }
            .print-header .company-sub {
              font-size: 8pt;
              color: #555;
              margin-top: 2px;
            }
            .print-header .report-meta {
              text-align: right;
              font-size: 8pt;
              color: #444;
              line-height: 1.6;
            }
            .print-header .report-meta strong {
              font-size: 10pt;
              color: #1a1a2e;
              display: block;
              margin-bottom: 2px;
            }

            /* Section title */
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

            /* KPI grid */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 4px;
            }
            .kpi-card {
              border: 1px solid #d8d8e8;
              border-radius: 4px;
              padding: 8px 10px;
              background: #fafafa;
            }
            .kpi-label {
              font-size: 7pt;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #777;
              margin-bottom: 4px;
            }
            .kpi-value {
              font-size: 13pt;
              font-weight: 700;
              color: #1a1a2e;
            }
            .kpi-value.green { color: #1a6b3c; }
            .kpi-value.red   { color: #8b1a1a; }
            .kpi-value.blue  { color: #1a3a6b; }

            /* Info box */
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

            /* Payment table */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9pt;
            }
            thead tr {
              background: #1a1a2e;
              color: white;
            }
            thead th {
              padding: 6px 10px;
              text-align: left;
              font-weight: 600;
              font-size: 8pt;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }
            tbody tr:nth-child(even) { background: #f2f2f8; }
            tbody td {
              padding: 6px 10px;
              border-bottom: 1px solid #e0e0ec;
              color: #1a1a2e;
            }
            tbody td.amount { font-weight: 600; }

            /* Operator cards */
            .operator-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            .operator-card {
              border: 1px solid #d0d0e8;
              border-radius: 4px;
              padding: 10px 12px;
              page-break-inside: avoid;
            }
            .operator-name {
              font-size: 10pt;
              font-weight: 700;
              color: #1a1a2e;
              margin-bottom: 2px;
            }
            .operator-summary {
              font-size: 8pt;
              color: #444;
              margin-bottom: 6px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e0e0ec;
            }
            .operator-row {
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              color: #333;
              padding: 2px 0;
            }
            .operator-row span:last-child { font-weight: 600; }

            /* Footer */
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
