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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../../clients/services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService } from '../../services/order.service';
import { ModalSalesNote } from '../../../sales/components/modal-sales-note/modal-sales-note';
import { Order } from '../../types/order';
import Client from '../../../clients/types/clients';
import { ConvertOrderToSaleDto, SalePaymentDto } from '../../types/convert-order-sale';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';

export type PaymentMethod =
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'PIX'
  | 'CREDITO_LOJA';

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
  selector: 'app-close-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalSalesNote],
  templateUrl: './close-order.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseOrder implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly clientService = inject(ClientService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('discountInput') discountInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('amountInput') amountInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('finishBtn') finishButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChildren('methodBtn') methodButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  order: Order | null = null;
  orderId = 0;
  isLoading = false;
  isFinishing = false;
  sellerName = 'Vendedor';

  subtotal = 0;
  /** Valor de desconto em R$, sempre o dado enviado ao backend */
  discount = 0;
  /** Modo de exibição do campo de desconto (não afeta o valor enviado) */
  discountMode: DiscountMode = 'valor';
  /** Valor exibido no input de desconto, de acordo com discountMode */
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

  customerSearchId = '';
  customerSearchName = '';
  selectedClient: Client | null = null;
  isSearchingClient = false;
  searchResults: Client[] = [];
  selectedClientId: number | null = null;

  cfop = '5102';
  csosn = '102';

  showSaleModal = false;
  saleData: any = null;

  Math = Math;

  ngOnInit(): void {
    this.initializeOrder();
  }

  private initializeOrder(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (!this.orderId) {
      this.notification.error('ID do pedido não informado');
      this.router.navigate(['/pedidos']);
      return;
    }
    this.loadOrder();
  }

  private loadOrder(): void {
    this.isLoading = true;
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.calculateTotals();
        this.isLoading = false;
        this.cdr.detectChanges();
        this.discountInputRef?.nativeElement.focus();
      },
      error: () => {
        this.notification.error('Erro ao carregar pedido');
        this.isLoading = false;
        this.router.navigate(['/pedidos']);
      },
    });
  }

  private calculateTotals(): void {
    if (!this.order) return;
    this.subtotal = this.order.items.reduce((sum, item) => sum + item.total, 0);
    this.total = this.subtotal - this.discount;
    this.syncDiscountInputValue();
    this.cdr.markForCheck();
  }

  toggleDiscountMode(): void {
    this.discountMode = this.discountMode === 'valor' ? 'percentual' : 'valor';
    this.syncDiscountInputValue();
    this.cdr.markForCheck();
  }

  /** Recalcula o valor exibido no input a partir do discount real (R$) */
  private syncDiscountInputValue(): void {
    if (this.discountMode === 'percentual') {
      this.discountInputValue =
        this.subtotal > 0 ? this.roundMoney((this.discount / this.subtotal) * 100) : 0;
    } else {
      this.discountInputValue = this.discount;
    }
  }

  /** Chamado pelo (ngModelChange) do input de desconto */
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
    this.cdr.markForCheck();
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

  /** Foca um elemento (ou executa um fallback) no próximo ciclo de detecção */
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
    const serviceCharge = this.order?.serviceCharge ?? 0;
    const totalWithService = this.total + serviceCharge;
    const amountPaidWithoutChange = this.totalPaid - this.totalChange;
    return Math.max(0, totalWithService - amountPaidWithoutChange);
  }

  get previewChange(): number {
    return Math.max(0, this.newPaymentAmount - this.remaining);
  }

  get isValidPayment(): boolean {
    if (this.payments.length === 0) return false;
    const serviceCharge = this.order?.serviceCharge ?? 0;
    const totalWithService = this.total + serviceCharge;
    const amountPaidWithoutChange = this.totalPaid - this.totalChange;
    return amountPaidWithoutChange >= totalWithService;
  }

  get isValidNewPayment(): boolean {
    if (!this.newPaymentMethod || this.newPaymentAmount <= 0) return false;
    if (this.remaining <= 0) return false;
    return true;
  }

  isPaymentMethodDisabled(methodId: PaymentMethod): boolean {
    return methodId === 'CREDITO_LOJA' && !this.selectedClient;
  }

  getPaymentMethodTooltip(method: PaymentMethodConfig): string {
    if (method.id === 'CREDITO_LOJA' && !this.selectedClient) {
      return 'Selecione um cliente para usar venda a prazo';
    }
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
    if (this.isPaymentMethodDisabled(method)) {
      this.notification.warning('Venda a prazo requer cliente cadastrado');
      return;
    }

    this.newPaymentMethod = method;
    this.newPaymentAmount = this.remaining;
    this.cdr.markForCheck();
  }

  addPayment(): void {
    if (!this.isValidNewPayment) return;

    // Bloquear pagamento maior que restante (exceto DINHEIRO)
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
    this.cdr.markForCheck();
  }

  removePayment(index: number): void {
    this.payments.splice(index, 1);
    this.cdr.markForCheck();
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

  getMaxPaymentAmount(): number {
    // DINHEIRO pode pagar mais (gera troco)
    if (this.newPaymentMethod === 'DINHEIRO') {
      return Number.MAX_SAFE_INTEGER;
    }
    // Outros métodos: máximo é o restante
    return this.remaining;
  }

  trackByClientId(_: number, client: Client): number {
    return client.id!;
  }

  searchCustomerById(): void {
    const id = this.customerSearchId.trim();
    if (!id) {
      this.notification.warning('Digite o ID do cliente');
      return;
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      this.notification.error('ID inválido');
      return;
    }

    this.isSearchingClient = true;
    this.clientService.findClientById(numId).subscribe({
      next: (client) => {
        this.setClient(client);
        this.clearSearchState();
      },
      error: () => {
        this.notification.error('Cliente não encontrado');
        this.clearSearchState();
      },
    });
  }

  searchCustomerByName(): void {
    const name = this.customerSearchName.trim();
    if (!name) {
      this.notification.warning('Digite um nome');
      return;
    }

    this.isSearchingClient = true;
    this.clientService.findClientByName(name).subscribe({
      next: (clients) => {
        if (clients.length === 0) {
          this.notification.warning('Nenhum cliente encontrado');
          this.clearSearchResults();
        } else if (clients.length === 1) {
          this.setClient(clients[0]);
          this.clearSearchResults();
        } else {
          this.searchResults = clients;
          this.selectedClientId = null;
          this.notification.info('Selecione um cliente da lista');
        }
        this.clearSearchState();
      },
      error: () => {
        this.notification.error('Erro ao buscar cliente');
        this.clearSearchState();
      },
    });
  }

  selectClientFromResults(): void {
    const client = this.searchResults.find((c) => c.id === Number(this.selectedClientId));
    if (!client) return;

    this.setClient(client);
    this.clearSearchResults();
    this.cdr.markForCheck();
  }

  private setClient(client: Client): void {
    if (!client.id) return;
    this.selectedClient = { ...client };
    this.notification.success(`Cliente ${client.name} selecionado`);
    this.cdr.markForCheck();
  }

  clearCustomer(): void {
    this.selectedClient = null;
    this.customerSearchId = '';
    this.customerSearchName = '';
    this.clearSearchResults();
    this.notification.info('Cliente removido');
    this.cdr.markForCheck();
  }

  private clearSearchResults(): void {
    this.searchResults = [];
    this.selectedClientId = null;
  }

  private clearSearchState(): void {
    this.isSearchingClient = false;
    this.cdr.markForCheck();
  }

  finishOrder(): void {
    if (!this.isValidPayment) {
      this.notification.error('Pagamento inválido');
      return;
    }

    if (!this.order?.items.length) {
      this.notification.error('Pedido vazio');
      return;
    }

    this.isFinishing = true;

    const dto: ConvertOrderToSaleDto = {
      payments: this.payments.map(
        (p): SalePaymentDto => ({
          method: p.method,
          amount: p.amount,
          change: p.change,
        }),
      ),
      clientId: this.selectedClient?.id || 1,
      discount: this.discount,
      cfop: this.cfop,
    };

    this.orderService.convertToSale(this.orderId, dto).subscribe({
      next: (sale) => {
        this.notification.success('Venda finalizada com sucesso');
        this.isFinishing = false;
        this.saleData = sale;
        this.showSaleModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Erro ao finalizar venda';
        this.notification.error(errorMsg);
        this.isFinishing = false;
        this.cdr.markForCheck();
      },
    });
  }

  closeSaleModal(): void {
    this.showSaleModal = false;
    this.router.navigate(['/comandas']);
  }

  async cancelOrder(): Promise<void> {
    const confirmed = await alertConfirm('Cancelar venda?');
    if (confirmed) {
      this.router.navigate(['/comandas']);
    }
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
