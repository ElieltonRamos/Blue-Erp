import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  inject,
} from '@angular/core';
import { Order } from '../../types/order';
import { Company } from '../../../company/types/company';
import { CompanyService } from '../../../company/services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'app-modal-order-note',
  imports: [PortalModule],
  templateUrl: './modal-order-note.html',
})
export class ModalOrderNote implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() orderData!: Order;
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  @ViewChild(CdkPortal) portal!: CdkPortal;

  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private overlay = inject(Overlay);
  private cdr = inject(ChangeDetectorRef);

  companyData: Company | null = null;
  private overlayRef: OverlayRef | null = null;

  private readonly overlayConfig = new OverlayConfig({
    hasBackdrop: true,
    backdropClass: 'modal-backdrop-dark',
    panelClass: 'modal-panel',
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this.overlay.scrollStrategies.block(),
    maxWidth: '90vw',
    maxHeight: '90vh',
  });

  ngOnInit(): void {
    this.loadCompanyData();
  }

  ngAfterViewInit(): void {
    if (this.isOpen) this.openModal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen && this.portal) {
        this.openModal();
      } else if (!this.isOpen) {
        this.closeOverlay();
      }
    }
  }

  ngOnDestroy(): void {
    this.closeOverlay();
  }

  private openModal(): void {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create(this.overlayConfig);
      this.overlayRef.backdropClick().subscribe(() => this.close());
      this.overlayRef.keydownEvents().subscribe((e) => {
        if (e.key === 'Escape') this.close();
      });
    }
    if (this.portal && !this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.portal);
    }
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  loadCompanyData(): void {
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyData = company;
        this.cdr.detectChanges();
      },
      error: () => this.notification.error('Erro ao carregar dados da empresa'),
    });
  }

  getFormattedDate(): string {
    return new Date(this.orderData.createdAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatNumber(n: any): string {
    const num = Number(n);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  formatCnpj(cnpj: string): string {
    return cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') ?? '';
  }

  formatPhone(phone: string): string {
    return phone?.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') ?? '';
  }

  print(): void {
    const content = document.getElementById('orderInvoiceContent')?.innerHTML;
    if (!content) return;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.styleSheets)
      .map((s) => {
        try {
          return s.href ? `<link rel="stylesheet" href="${s.href}">` : '';
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
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 5mm; width: 80mm; font-family: 'Courier New', monospace; font-size: 10pt; }
              * { font-weight: bold !important; }
              button, .no-print { display: none !important; }
              table { width: 100%; border-collapse: collapse; font-size: 9pt; }
              th, td { padding: 2px; text-align: left; }
              hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 100);">
          ${content}
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }

  close(): void {
    this.closeModal.emit();
  }
}
