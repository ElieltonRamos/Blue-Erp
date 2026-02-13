import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FiscalStatus, Sale, SaleItem } from '../../types/sale';
import { LicenseService } from '../../../../core/services/license.service';
import { NfceEmissaoResponse, NfceService } from '../../services/nfce.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { CompanyService } from '../../../company/services/company.service';
import { Company } from '../../../company/types/company';

@Component({
  selector: 'app-modal-sales-note',
  imports: [],
  templateUrl: './modal-sales-note.html',
})
export class ModalSalesNote implements OnInit {
  @Input() saleData!: Sale;
  @Output() closeModal = new EventEmitter();

  private licenseService = inject(LicenseService);
  private nfceService = inject(NfceService);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  isRequestingNfce = false;
  nfceData: NfceEmissaoResponse | null = null;
  companyData: Company | null = null;

  canEmitNfce = this.licenseService.getCurrentPlan() !== 'basic';

  ngOnInit() {
    this.loadCompanyData();
  }

  loadCompanyData() {
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyData = company;
        this.cdr.detectChanges();
      },
      error: (_error) => {
        this.notification.error('Erro ao carregar dados da empresa');
      },
    });
  }

  formatCnpj(cnpj: string): string {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  }

  getDateSale() {
    const date = new Date(this.saleData.date);
    // Ajusta para compensar a conversão UTC
    date.setHours(date.getHours() + 3);

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getQuantity(item: SaleItem): number {
    return Number(item.quantity) ?? 0;
  }

  calculateDiscount(): number {
    const discount = this.saleData.totalProductsWithoutDiscount - this.saleData.total;
    if (discount > 0) {
      return this.formatNumber(discount);
    }
    return 0;
  }

  formatNumber(n: any): number {
    const num = Number(n);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
  }

  close() {
    this.closeModal.emit();
  }

  hasNfce(): boolean {
    return this.saleData.fiscalStatus === FiscalStatus.EMITIDA && !!this.saleData.fiscalKey;
  }

  requestNfce() {
    if (!this.canEmitNfce) {
      this.notification.error(
        'Recurso disponível apenas no plano Pro! Faça upgrade para emitir notas fiscais.',
      );
      return;
    }

    if (this.hasNfce()) {
      this.downloadPdf(this.saleData.fiscalKey!);
      return;
    }

    this.isRequestingNfce = true;

    this.nfceService.emitirPorVenda(this.saleData.id!, 1, true).subscribe({
      next: (response) => {
        this.nfceData = response;
        this.isRequestingNfce = false;

        if (response.status === 'autorizada') {
          this.notification.success(
            `NFC-e autorizada com sucesso!\n\n` +
              `Chave: ${this.formatChave(response.chaveAcesso)}\n` +
              `Protocolo: ${response.protocolo || 'N/A'}`,
          );
          this.saleData.fiscalStatus = FiscalStatus.EMITIDA;
          this.saleData.fiscalKey = response.chaveAcesso;
          this.saleData.fiscalProtocol = response.protocolo;
          this.saleData.fiscalEmitDate = new Date();
          this.downloadPdf(response.chaveAcesso);
        } else if (response.status === 'rejeitada') {
          this.notification.error(`NFC-e rejeitada pela SEFAZ:\n${response.mensagem}`);
        } else if (response.status === 'contingencia') {
          this.notification.warning(`NFC-e emitida em contingência:\n${response.mensagem}`);
          this.downloadPdf(response.chaveAcesso);
        }
      },
      error: (error) => {
        this.isRequestingNfce = false;
        console.error('Erro completo NFC-e:', error);
        this.notification.error(
          `Erro ao solicitar NFC-e:\n${
            error.error?.message || error.message || 'Erro desconhecido'
          }`,
        );
      },
    });
  }

  formatChave(chave: string): string {
    return this.nfceService.formatarChaveAcesso(chave);
  }

  downloadPdf(chaveAcesso: string) {
    this.nfceService.downloadPdf(chaveAcesso).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chaveAcesso}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('DANFE baixado com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao baixar PDF:', error);
        this.notification.error('Erro ao baixar o DANFE');
      },
    });
  }
  print() {
    const content = document.getElementById('invoiceContent')?.innerHTML;
    if (!content) {
      console.error('Conteúdo da nota fiscal não encontrado.');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      console.error('Não foi possível acessar o iframe.');
      return;
    }

    // Importa os estilos do Tailwind do app
    const styles = Array.from(document.styleSheets)
      .map((style) => {
        try {
          return style.href ? `<link rel="stylesheet" href="${style.href}">` : '';
        } catch {
          return '';
        }
      })
      .join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          ${styles}
          <style>
            @media print {
              @page {
                size: 80mm auto;  /* largura 80mm, altura automática */
                margin: 0;         /* sem margens extras */
              }

              body {
                margin: 0;
                padding: 5mm;      /* pequeno padding interno */
                width: 80mm;
                font-family: 'Courier New', monospace;
                font-size: 10pt;
                font-weight: bold; /* Todo texto em negrito */
              }

              /* Garante negrito em todos os elementos */
              * {
                font-weight: bold !important;
              }

              .cupom-nao-fiscal {
                width: 100%;
                page-break-inside: avoid;
                break-inside: avoid;
              }

              /* Oculta botões e elementos desnecessários */
              button, .no-print {
                display: none !important;
              }

              /* Ajusta tabelas para cupom */
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9pt;
              }

              th, td {
                padding: 2px;
                text-align: left;
              }

              /* Linha divisória */
              hr {
                border: none;
                border-top: 1px dashed #000;
                margin: 5px 0;
              }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 100);">
          <div class="cupom-nao-fiscal">
            ${content}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => document.body.removeChild(iframe), 2000);
  }
}
