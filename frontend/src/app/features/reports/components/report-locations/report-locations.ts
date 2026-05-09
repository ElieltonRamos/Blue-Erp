import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { LocationReportData, locationReportMock } from '../../types/reportLocations';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

@Component({
  selector: 'app-report-locations',
  imports: [FormsModule],
  templateUrl: './report-locations.html',
})
export class ReportLocations {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private companyService = inject(CompanyService);
  companyData: Company | null = null;
  reportGenerated = false;
  report: LocationReportData = locationReportMock;

  startDate: string = '';
  endDate: string = '';
  isLoading = false;

  ngOnInit() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    this.startDate = this.formatDate(now);
    this.endDate = this.formatDate(now);
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyData = company;
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

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatMinutes(minutes: number | null): string {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes.toFixed(0)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}min`;
  }

  toggleCategory(locationId: number, categoryName: string) {
    const key = `${locationId}-${categoryName}`;
    this.openCategories[key] = !this.openCategories[key];
  }

  isCategoryOpen(locationId: number, categoryName: string): boolean {
    const key = `${locationId}-${categoryName}`;
    return this.openCategories[key] !== false;
  }

  toggleOperators(locationId: number) {
    this.openOperators[locationId] = !this.openOperators[locationId];
  }

  isOperatorsOpen(locationId: number): boolean {
    return this.openOperators[locationId] === true;
  }

  private openCategories: Record<string, boolean> = {};
  private openOperators: Record<number, boolean> = {};

  getTodayFormatted(): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(),
    );
  }

  print() {
    const { matrix, productionLocations } = this.getMatrix();

    const matrixRows = this.report.locations
      .map((loc) => {
        const cells = productionLocations
          .map((p) => {
            const val = this.getMatrixValue(matrix, loc.name, p);
            return `<td class="amount">${val > 0 ? this.formatCurrency(val) : '—'}</td>`;
          })
          .join('');
        const rowTotal = this.getRowTotal(matrix, loc.name, productionLocations);
        return `<tr><td>${loc.name}</td>${cells}<td class="amount total">${this.formatCurrency(rowTotal)}</td></tr>`;
      })
      .join('');

    const colFooters = productionLocations
      .map((p) => `<td class="amount">${this.formatCurrency(this.getColTotal(matrix, p))}</td>`)
      .join('');
    const grandTotal = this.getGrandTotal(matrix, productionLocations);

    const productionHeaders = productionLocations.map((p) => `<th>${p}</th>`).join('');

    const locationCards = this.report.locations
      .map((loc) => {
        const operatorRows = loc.operators
          .map(
            (op) => `
      <tr>
        <td>${op.username}</td>
        <td class="amount">${op.opened}</td>
        <td class="amount">${op.closed}</td>
        <td class="amount">${this.formatCurrency(op.totalValue)}</td>
        <td class="amount">${this.formatCurrency(op.totalServiceCharge)}</td>
      </tr>
    `,
          )
          .join('');

        const categoryRows = loc.categories
          .map((cat) => {
            const itemRows = cat.items
              .map(
                (item) => `
        <tr>
          <td style="padding-left:16px">${item.name}</td>
          <td>${item.producedAt}</td>
          <td class="amount">${item.qty} un</td>
          <td class="amount">${this.formatCurrency(item.value)}</td>
        </tr>
      `,
              )
              .join('');
            return `
        <tr class="cat-header">
          <td colspan="2"><strong>${cat.name}</strong> — ${cat.totalQty} un</td>
          <td class="amount" colspan="2"><strong>${this.formatCurrency(cat.totalValue)}</strong></td>
        </tr>
        ${itemRows}
      `;
          })
          .join('');

        return `
      <div class="loc-card">
        <div class="loc-header">
          <span class="loc-name">${loc.name}</span>
          <span class="loc-total">${this.formatCurrency(loc.totalValue)}</span>
        </div>
        <div class="loc-metrics">
          <div class="metric"><div class="metric-label">Comandas</div><div class="metric-value">${loc.totalOrders}</div></div>
          <div class="metric"><div class="metric-label">Tempo Comanda</div><div class="metric-value">${this.formatMinutes(loc.averageCommandaMinutes)}</div></div>
          <div class="metric"><div class="metric-label">Ocup. Mesa</div><div class="metric-value">${this.formatMinutes(loc.averageTableOccupationMinutes)}</div></div>
          <div class="metric"><div class="metric-label">Top Produto</div><div class="metric-value">${loc.topProduct}</div></div>
        </div>
        ${
          loc.operators.length > 0
            ? `
          <div class="section-title">Operadores</div>
          <table>
            <thead><tr><th>Operador</th><th>Abriu</th><th>Fechou</th><th>Total</th><th>Gorjeta</th></tr></thead>
            <tbody>${operatorRows}</tbody>
          </table>
        `
            : ''
        }
        <div class="section-title">Categorias e Itens</div>
        <table>
          <thead><tr><th>Produto</th><th>Produzido em</th><th>Qtd</th><th>Total</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table>
      </div>
    `;
      })
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

          table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 8px; }
          thead tr { background: #1a1a2e; color: white; }
          thead th { padding: 5px 8px; text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
          tbody tr:nth-child(even) { background: #f2f2f8; }
          tbody td { padding: 5px 8px; border-bottom: 1px solid #e0e0ec; }
          tbody td.amount { text-align: right; font-weight: 600; }
          tfoot td { padding: 5px 8px; font-weight: 700; border-top: 2px solid #1a1a2e; }
          tfoot td.amount { text-align: right; }
          tfoot td.total { text-align: right; color: #1a6b3c; }
          tr.cat-header { background: #e8e8f4 !important; }
          tr.cat-header td { padding: 5px 8px; }

          .loc-card { border: 1px solid #d0d0e8; border-radius: 4px; padding: 10px 12px; margin-bottom: 14px; }
          .loc-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid #e0e0ec; padding-bottom: 6px; }
          .loc-name { font-size: 11pt; font-weight: 700; }
          .loc-total { font-size: 11pt; font-weight: 700; color: #1a6b3c; }
          .loc-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
          .metric { background: #f5f5fa; border: 1px solid #ddd; border-radius: 3px; padding: 5px 8px; }
          .metric-label { font-size: 7pt; color: #888; text-transform: uppercase; margin-bottom: 2px; }
          .metric-value { font-size: 9pt; font-weight: 700; }

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
            <strong>Relatório por Local</strong>
            Período: ${this.getFullDate()}<br/>
            Emitido em: ${this.getTodayFormatted()}
          </div>
        </div>

        <div class="section-title">Consumo Consolidado por Local</div>
        <table>
          <thead>
            <tr>
              <th>Local de Venda</th>
              ${productionHeaders}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${matrixRows}</tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              ${colFooters}
              <td class="total">${this.formatCurrency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title">Detalhamento por Local</div>
        ${locationCards}

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
