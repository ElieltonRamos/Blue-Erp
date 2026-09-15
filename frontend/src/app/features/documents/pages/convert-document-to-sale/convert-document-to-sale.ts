import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { DocumentService } from '../../services/document.service';
import { FinalizeDocumentDTO, OSDocument, SalePaymentDto } from '../../types/documents.types';
import { ModalSalesNote } from '../../../sales/components/modal-sales-note/modal-sales-note';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { PaymentMethod } from '../../../orders/pages/close-order/close-order';
import { Sale } from '../../../sales/types/sale';

export type DiscountMode = 'valor' | 'percentual';

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  change: number;
}

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: string;
}

const FOCUS_DELAY_MS = 0;

@Component({
  selector: 'app-convert-document-to-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalSalesNote],
  templateUrl: './convert-document-to-sale.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvertDocumentToSale implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('discountInput') discountInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('amountInput') amountInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('finishBtn') finishButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChildren('methodBtn') methodButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  showShortcutsModal = false;
  document: OSDocument | null = null;
  documentId = 0;
  isLoading = false;
  isFinishing = false;

  subtotal = 0;
  discount = 0;
  discountMode: DiscountMode = 'valor';
  discountInputValue = 0;
  total = 0;

  payments: PaymentEntry[] = [];
  newPaymentMethod: PaymentMethod | null = null;
  newPaymentAmount = 0;

  paymentMethods: PaymentMethodConfig[] = [
    { id: 'DINHEIRO', name: 'Dinheiro', icon: '💵' },
    { id: 'CARTAO_CREDITO', name: 'Crédito', icon: '💳' },
    { id: 'CARTAO_DEBITO', name: 'Débito', icon: '💳' },
    { id: 'PIX', name: 'PIX', icon: '📱' },
    { id: 'CREDITO_LOJA', name: 'Prazo', icon: '📅' },
  ];

  cfop = '5102';

  showSaleModal = false;
  saleData: Sale | null = null;

  Math = Math;

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.showShortcutsModal) {
      this.closeShortcutsModal();
    }
  }
  
  ngOnInit(): void {
    this.initializeDocument();
  }

  private initializeDocument(): void {
    this.documentId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (!this.documentId) {
      this.notification.error('ID do documento não informado');
      this.router.navigate(['/ordem-servico']);
      return;
    }
    this.loadDocument();
  }

  private loadDocument(): void {
    this.isLoading = true;
    this.documentService.getById(this.documentId).subscribe({
      next: (document) => {
        if (document.status !== 'IN_PROGRESS') {
          this.notification.error('Apenas documentos em andamento podem ser finalizados');
          this.router.navigate(['/ordem-servico']);
          return;
        }
        this.document = document;
        this.calculateTotals();
        this.isLoading = false;
        this.cdr.detectChanges();
        this.discountInputRef?.nativeElement.focus();
      },
      error: () => {
        this.notification.error('Erro ao carregar documento');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/ordem-servico']);
      },
    });
  }

  private calculateTotals(): void {
    if (!this.document) return;
    this.subtotal = this.document.items.reduce((sum, item) => sum + Number(item.total), 0);
    this.total = this.subtotal - this.discount;
    this.syncDiscountInputValue();
    this.cdr.detectChanges();
  }

  toggleDiscountMode(): void {
    this.discountMode = this.discountMode === 'valor' ? 'percentual' : 'valor';
    this.syncDiscountInputValue();
    this.cdr.detectChanges();
  }

  private syncDiscountInputValue(): void {
    if (this.discountMode === 'percentual') {
      this.discountInputValue =
        this.subtotal > 0 ? this.roundMoney((this.discount / this.subtotal) * 100) : 0;
    } else {
      this.discountInputValue = this.discount;
    }
  }

  onDiscountInputChange(): void {
    const rawValue = Math.max(0, this.discountInputValue || 0);

    if (this.discountMode === 'percentual') {
      const pct = Math.min(100, rawValue);
      this.discountInputValue = pct;
      this.discount = this.roundMoney((this.subtotal * pct) / 100);
    } else {
      this.discount = rawValue;
    }

    this.total = this.subtotal - this.discount;
    this.cdr.detectChanges();
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  onDiscountEnter(event: Event): void {
    event.preventDefault();
    this.focusFirstEnabledMethod();
  }

  onMethodKeydown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.focusAdjacentMethod(index, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusAdjacentMethod(index, -1);
        break;
      case 'Enter':
        event.preventDefault();
        this.confirmMethodSelection(index);
        break;
    }
  }

  private confirmMethodSelection(index: number): void {
    const method = this.paymentMethods[index]?.id;
    if (!method || this.isPaymentMethodDisabled(method)) return;

    this.selectNewMethod(method);
    this.focusElement(this.amountInputRef);
  }

  private focusFirstEnabledMethod(): void {
    const index = this.paymentMethods.findIndex((m) => !this.isPaymentMethodDisabled(m.id));
    this.focusMethodAt(index);
  }

  private focusAdjacentMethod(fromIndex: number, direction: 1 | -1): void {
    const total = this.paymentMethods.length;
    if (total === 0) return;

    for (let step = 1; step <= total; step++) {
      const nextIndex = (fromIndex + direction * step + total) % total;
      if (!this.isPaymentMethodDisabled(this.paymentMethods[nextIndex].id)) {
        this.focusMethodAt(nextIndex);
        return;
      }
    }
  }

  private focusMethodAt(index: number): void {
    if (index < 0) return;
    const button = this.methodButtons?.toArray()[index];
    button?.nativeElement.focus();
  }

  onAmountEnter(event: Event): void {
    event.preventDefault();
    if (!this.isValidNewPayment) return;

    this.addPayment();

    this.focusElement(
      this.isValidPayment ? this.finishButtonRef : undefined,
      !this.isValidPayment ? () => this.focusFirstEnabledMethod() : undefined,
    );
  }

  private focusElement(ref?: ElementRef<HTMLElement>, fallback?: () => void): void {
    setTimeout(() => {
      if (ref?.nativeElement) {
        ref.nativeElement.focus();
      } else {
        fallback?.();
      }
    }, FOCUS_DELAY_MS);
  }

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get totalChange(): number {
    return this.payments.reduce((sum, p) => sum + p.change, 0);
  }

  get remaining(): number {
    const amountPaidWithoutChange = this.totalPaid - this.totalChange;
    return Math.max(0, this.total - amountPaidWithoutChange);
  }

  get previewChange(): number {
    return Math.max(0, this.newPaymentAmount - this.remaining);
  }

  get isValidPayment(): boolean {
    if (this.payments.length === 0) return false;
    const amountPaidWithoutChange = this.totalPaid - this.totalChange;
    return amountPaidWithoutChange >= this.total;
  }

  get isValidNewPayment(): boolean {
    if (!this.newPaymentMethod || this.newPaymentAmount <= 0) return false;
    if (this.remaining <= 0) return false;
    return true;
  }

  isPaymentMethodDisabled(_methodId: PaymentMethod): boolean {
    return false;
  }

  getPaymentMethodTooltip(method: PaymentMethodConfig): string {
    return method.name;
  }

  getFinishButtonTooltip(): string {
    if (this.payments.length === 0) {
      return 'Adicione pelo menos um método de pagamento';
    }
    if (this.remaining > 0.01) {
      return `Faltam R$ ${this.remaining.toFixed(2)} para completar o pagamento`;
    }
    if (this.isFinishing) {
      return 'Finalizando venda...';
    }
    return 'Finalizar venda';
  }

  getAddPaymentButtonTooltip(): string {
    if (this.newPaymentAmount <= 0) {
      return 'Digite um valor válido';
    }
    if (this.remaining <= 0) {
      return 'Pagamento já foi completado';
    }
    return 'Adicionar este pagamento';
  }

  selectNewMethod(method: PaymentMethod): void {
    if (this.isPaymentMethodDisabled(method)) return;

    this.newPaymentMethod = method;
    this.newPaymentAmount = this.remaining;
    this.cdr.detectChanges();
  }

  addPayment(): void {
    if (!this.isValidNewPayment) return;

    if (this.newPaymentMethod !== 'DINHEIRO' && this.newPaymentAmount > this.remaining) {
      this.notification.error(
        `${this.getMethodLabel(this.newPaymentMethod!)} não pode exceder R$ ${this.remaining.toFixed(2)}`,
      );
      return;
    }

    const change = this.newPaymentMethod === 'DINHEIRO' ? this.previewChange : 0;

    this.payments.push({
      method: this.newPaymentMethod!,
      amount: this.newPaymentAmount,
      change,
    });

    this.resetPaymentInput();
    this.cdr.detectChanges();
  }

  removePayment(index: number): void {
    this.payments.splice(index, 1);
    this.cdr.detectChanges();
  }

  private resetPaymentInput(): void {
    this.newPaymentMethod = null;
    this.newPaymentAmount = 0;
  }

  getMethodLabel(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.id === method)?.name ?? method;
  }

  getMethodIcon(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.id === method)?.icon ?? '';
  }

  finishDocument(): void {
    if (!this.isValidPayment) {
      this.notification.error('Pagamento inválido');
      return;
    }

    if (!this.document?.items.length) {
      this.notification.error('Documento sem itens');
      return;
    }

    this.isFinishing = true;
    this.cdr.detectChanges();

    const dto: FinalizeDocumentDTO = {
      payments: this.payments.map(
        (p): SalePaymentDto => ({
          method: p.method,
          amount: p.amount,
          change: p.change,
        }),
      ),
      discount: this.discount,
      cfop: this.cfop,
    };

    this.documentService.finalizeDocument(this.documentId, dto).subscribe({
      next: (sale) => {
        this.notification.success('Venda finalizada com sucesso');
        this.isFinishing = false;
        this.saleData = sale;
        this.showSaleModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Erro ao finalizar venda';
        this.notification.error(errorMsg);
        this.isFinishing = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeSaleModal(): void {
    this.showSaleModal = false;
    this.router.navigate(['/ordem-servico']);
  }

  async cancelConversion(): Promise<void> {
    const confirmed = await alertConfirm('Cancelar finalização?');
    if (confirmed) {
      this.router.navigate(['/ordem-servico']);
    }
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }

  toggleShortcutsModal(): void {
    this.showShortcutsModal = !this.showShortcutsModal;
    this.cdr.detectChanges();
  }

  closeShortcutsModal(): void {
    this.showShortcutsModal = false;
    this.cdr.detectChanges();
  }
}
