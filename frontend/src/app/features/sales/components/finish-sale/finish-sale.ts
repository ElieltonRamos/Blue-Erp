import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalePaymentDto } from '../../types/sale';

export type PaymentMethod =
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'PIX'
  | 'CREDITO_LOJA';

export interface PaymentEntry {
  paymentMethod: PaymentMethod;
  value: number;
  change: number;
}

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
}

@Component({
  selector: 'app-finish-sale',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finish-sale.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinishSale {
  @Input() resetTrigger = 0;
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('methodSelect') methodSelectRef?: ElementRef<HTMLSelectElement>;
  @ViewChild('valueInput') valueInputRef?: ElementRef<HTMLInputElement>;

  @Input() totalValue = 0;
  @Input() clientId: number | null = 1;

  @Input() discountValue = 0;
  @Output() discountValueChange = new EventEmitter<number>();

  @Output() paymentsChange = new EventEmitter<SalePaymentDto[]>();

  paymentEntries: PaymentEntry[] = [];
  selectedMethod: PaymentMethod = 'DINHEIRO';
  selectedValue = 0;

  private readonly paymentMethods: PaymentMethodConfig[] = [
    { id: 'DINHEIRO', name: 'Dinheiro' },
    { id: 'CARTAO_CREDITO', name: 'Cartão Crédito' },
    { id: 'CARTAO_DEBITO', name: 'Cartão Débito' },
    { id: 'PIX', name: 'Pix' },
    { id: 'CREDITO_LOJA', name: 'Notinha' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetTrigger'] && !changes['resetTrigger'].firstChange) {
      this.paymentEntries = [];
      this.selectedMethod = 'DINHEIRO';
      this.selectedValue = 0;
      this.emitPayments();
      this.cdr.markForCheck();
    }
  }

  get finalTotal(): number {
    return Math.max(this.totalValue - this.discountValue, 0);
  }

  get totalPaid(): number {
    return this.paymentEntries.reduce((sum, p) => sum + p.value, 0);
  }

  get totalChange(): number {
    return this.paymentEntries.reduce((sum, p) => sum + p.change, 0);
  }

  get remainingValue(): number {
    return Math.max(this.finalTotal - (this.totalPaid - this.totalChange), 0);
  }

  get previewChange(): number {
    return Math.max(this.selectedValue - this.remainingValue, 0);
  }

  getMethodLabel(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.id === method)?.name ?? method;
  }

  onDiscountChange(value: number): void {
    let discount = Number(value ?? 0);
    if (isNaN(discount) || discount < 0) discount = 0;
    if (discount > this.totalValue) discount = this.totalValue;

    this.discountValue = discount;
    this.discountValueChange.emit(discount);
    this.cdr.markForCheck();
  }

  onMethodChange(): void {
    this.selectedValue = this.remainingValue;
  }

  onMethodKeydownEnter(): void {
    this.selectedValue = this.remainingValue;
    setTimeout(() => this.valueInputRef?.nativeElement.focus());
  }

  addPayment(): void {
    if (!this.selectedMethod || this.selectedValue <= 0) return;
    if (this.remainingValue <= 0.01) return;

    if (this.selectedMethod !== 'DINHEIRO' && this.selectedValue > this.remainingValue) {
      this.selectedValue = this.remainingValue;
    }

    const change = this.selectedMethod === 'DINHEIRO' ? this.previewChange : 0;

    this.paymentEntries.push({
      paymentMethod: this.selectedMethod,
      value: this.selectedValue,
      change,
    });

    this.emitPayments();
    this.selectedValue = 0;
    this.cdr.markForCheck();

    setTimeout(() => this.methodSelectRef?.nativeElement.focus());
  }

  removePayment(index: number): void {
    this.paymentEntries.splice(index, 1);
    this.emitPayments();
    this.cdr.markForCheck();
  }

  focusMethodSelect(): void {
    this.methodSelectRef?.nativeElement.focus();
  }

  private emitPayments(): void {
    const payments: SalePaymentDto[] = this.paymentEntries.map((p) => ({
      method: p.paymentMethod,
      amount: p.value,
      change: p.change,
    }));
    this.paymentsChange.emit(payments);
  }
}
