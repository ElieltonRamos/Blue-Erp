import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { WorkshopReportData, workshopReportMock } from '../../types/reportWorkshop';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

@Component({
  selector: 'app-report-workshop',
  imports: [FormsModule],
  templateUrl: './report-workshop.html',
})
export class ReportWorkshop {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private companyService = inject(CompanyService);
  companyData: Company | null = null;

  reportGenerated = false;
  report: WorkshopReportData = workshopReportMock;

  startDate: string = '';
  endDate: string = '';
  isLoading = false;

  ngOnInit() {
    const now = new Date();
    this.startDate = this.formatDate(now);
    this.endDate = this.formatDate(now);
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyData = company;
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

    this.reportService.generateReportWorkshop(this.startDate, this.endDate).subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.report = response.data;
          this.reportGenerated = true;
        } else {
          this.notification.error(response.message ?? 'Erro ao gerar relatório');
        }
      },
      error: (err) => {
        this.notification.error(err?.error?.message ?? 'Erro inesperado ao gerar relatório');
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDateDisplay(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
  }

  print() {
    const topVehiclesRows = this.report.topVehicles
      .map(
        (v, i) => `
      <tr>
        <td>${i + 1}º</td>
        <td>${v.label}</td>
        <td>${v.clientName}</td>
        <td class="amount">${v.visits}x</td>
        <td class="amount">${this.formatCurrency(v.totalValue)}</td>
      </tr>
    `,
      )
      .join('');

    const vehicleRows = this.report.vehicles
      .map(
        (v) => `
      <tr>
        <td>${v.label}</td>
        <td>${v.clientName}</td>
        <td class="amount">${v.visits}</td>
        <td class="amount">${this.formatCurrency(v.totalValue)}</td>
        <td class="amount">${this.formatDateDisplay(v.lastVisit)}</td>
      </tr>
    `,
      )
      .join('');

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
          body { font-family: 'IBM Plex Sans', sans-serif; font-size: 9pt; color: #1a1a2e; background: white; }

          .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 14px; }
          .print-header img { height: 36px; }
          .company-name { font-size: 15pt; font-weight: 700; }
          .company-sub { font-size: 8pt; color: #555; margin-top: 2px; }
          .report-meta { text-align: right; font-size: 8pt; color: #444; line-height: 1.6; }
          .report-meta strong { font-size: 10pt; display: block; margin-bottom: 2px; }

          .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-left: 3px solid #1a1a2e; padding-left: 8px; margin: 14px 0 8px; }

          .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
          .summary-card { background: #f5f5fa; border: 1px solid #ddd; border-radius: 4px; padding: 8px; text-align: center; }
          .summary-label { font-size: 7pt; color: #888; text-transform: uppercase; margin-bottom: 3px; }
          .summary-value { font-size: 11pt; font-weight: 700; }

          table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px; }
          thead tr { background: #1a1a2e; color: white; }
          thead th { padding: 5px 8px; text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
          tbody tr:nth-child(even) { background: #f2f2f8; }
          tbody td { padding: 5px 8px; border-bottom: 1px solid #e0e0ec; }
          tbody td.amount { text-align: right; font-weight: 600; }

          .print-footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ccc; display: flex; justify-content: space-between; font-size: 7pt; color: #888; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="/blue-erp.png" alt="Logo" />
            <div>
              <div class="company-name">${this.companyData?.tradeName || this.companyData?.corporateName || ''}</div>
              <div class="company-sub">CNPJ: ${this.companyData?.cnpj || ''} &nbsp;|&nbsp; ${this.companyData?.city || ''}/${this.companyData?.state || ''}</div>
            </div>
          </div>
          <div class="report-meta">
            <strong>Relatório da Oficina</strong>
            Período: ${this.getFullDate()}<br/>
            Emitido em: ${this.getTodayFormatted()}
          </div>
        </div>

        <div class="section-title">Resumo do Período</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Orçamentos / OS</div>
            <div class="summary-value">${this.report.summary.totalDocuments}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Faturamento</div>
            <div class="summary-value">${this.formatCurrency(this.report.summary.totalRevenue)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Ticket Médio</div>
            <div class="summary-value">${this.formatCurrency(this.report.summary.averageTicket)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Veículos Atendidos</div>
            <div class="summary-value">${this.report.summary.vehiclesServed}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Sem Veículo</div>
            <div class="summary-value">${this.report.summary.documentsWithoutVehicle}</div>
          </div>
        </div>

        <div class="section-title">Veículos que Mais Vieram</div>
        <table>
          <thead><tr><th>#</th><th>Veículo</th><th>Cliente</th><th>Visitas</th><th>Total</th></tr></thead>
          <tbody>${topVehiclesRows}</tbody>
        </table>

        <div class="section-title">Veículos Atendidos</div>
        <table>
          <thead><tr><th>Veículo</th><th>Cliente</th><th>Visitas</th><th>Total</th><th>Última Visita</th></tr></thead>
          <tbody>${vehicleRows}</tbody>
        </table>

        ${
          this.report.noVehicle.totalDocuments > 0
            ? `
          <div class="section-title">Sem Veículo Vinculado</div>
          <table>
            <thead><tr><th>Quantidade</th><th>Valor Total</th></tr></thead>
            <tbody><tr><td>${this.report.noVehicle.totalDocuments}</td><td class="amount">${this.formatCurrency(this.report.noVehicle.totalValue)}</td></tr></tbody>
          </table>
        `
            : ''
        }

        <div class="print-footer">
          <span>${this.companyData?.tradeName || ''} — Sistema Blue ERP</span>
          <span>Gerado em ${this.getTodayFormatted()}</span>
        </div>
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
