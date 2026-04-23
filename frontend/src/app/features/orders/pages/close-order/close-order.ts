import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  change: number;
}

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

  order: Order | null = null;
  orderId = 0;
  isLoading = false;
  isFinishing = false;
  sellerName = 'Vendedor';

  subtotal = 0;
  discount = 0;
  total = 0;

  payments: PaymentEntry[] = [];
  newPaymentMethod: PaymentMethod | null = null;
  newPaymentAmount = 0;

  paymentMethods = [
    { id: 'DINHEIRO' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
    { id: 'CARTAO_CREDITO' as PaymentMethod, name: 'Crédito', icon: '💳' },
    { id: 'CARTAO_DEBITO' as PaymentMethod, name: 'Débito', icon: '💳' },
    { id: 'PIX' as PaymentMethod, name: 'PIX', icon: '📱' },
    { id: 'CREDITO_LOJA' as PaymentMethod, name: 'Prazo', icon: '📅' },
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

  ngOnInit(): void {
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Erro ao carregar pedido');
        this.isLoading = false;
        this.router.navigate(['/pedidos']);
      },
    });
  }

  calculateTotals(): void {
    if (!this.order) return;
    this.subtotal = this.order.items.reduce((sum, i) => sum + i.total, 0);
    this.total = this.subtotal - this.discount;
    this.cdr.markForCheck();
  }

  updateDiscount(): void {
    this.calculateTotals();
  }

  get totalPaid(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  get totalChange(): number {
    return this.payments.reduce((sum, p) => sum + p.change, 0);
  }

  get remaining(): number {
    const service = this.order?.serviceCharge ?? 0;
    return Math.max(0, this.total + service - (this.totalPaid - this.totalChange));
  }

  get isValidPayment(): boolean {
    if (this.payments.length === 0) return false;
    const service = this.order?.serviceCharge ?? 0;
    return this.totalPaid - this.totalChange >= this.total + service;
  }

  selectNewMethod(method: PaymentMethod): void {
    if (method === 'CREDITO_LOJA' && !this.selectedClient) {
      this.notification.warning('Venda a prazo requer cliente cadastrado');
      return;
    }
    this.newPaymentMethod = method;
    this.newPaymentAmount = this.remaining;
    this.cdr.markForCheck();
  }

  addPayment(): void {
    if (!this.newPaymentMethod || this.newPaymentAmount <= 0) return;

    const change =
      this.newPaymentMethod === 'DINHEIRO'
        ? Math.max(0, this.newPaymentAmount - this.remaining)
        : 0;

    this.payments.push({
      method: this.newPaymentMethod,
      amount: this.newPaymentAmount,
      change,
    });

    this.newPaymentMethod = null;
    this.newPaymentAmount = 0;
    this.cdr.markForCheck();
  }

  removePayment(index: number): void {
    this.payments.splice(index, 1);
    this.cdr.markForCheck();
  }

  getMethodLabel(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.id === method)?.name ?? method;
  }

  getMethodIcon(method: PaymentMethod): string {
    return this.paymentMethods.find((m) => m.id === method)?.icon ?? '';
  }

  searchCustomerById(): void {
    if (!this.customerSearchId.trim()) {
      this.notification.warning('Digite o ID do cliente');
      return;
    }
    const id = Number(this.customerSearchId);
    if (isNaN(id)) {
      this.notification.error('ID inválido');
      return;
    }
    this.isSearchingClient = true;
    this.clientService.findClientById(id).subscribe({
      next: (client) => {
        this.setClient(client);
        this.isSearchingClient = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Cliente não encontrado');
        this.isSearchingClient = false;
        this.cdr.markForCheck();
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
        this.searchResults = clients;
        if (clients.length === 1) {
          this.setClient(clients[0]);
          this.clearSearchResults();
        } else if (clients.length === 0) {
          this.notification.warning('Nenhum cliente encontrado');
          this.clearSearchResults();
        } else {
          this.selectedClientId = null;
          this.notification.info('Selecione um cliente');
        }
        this.isSearchingClient = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Erro ao buscar cliente');
        this.isSearchingClient = false;
        this.clearSearchResults();
        this.cdr.markForCheck();
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
  }

  clearCustomer(): void {
    this.selectedClient = null;
    this.customerSearchId = '';
    this.customerSearchName = '';
    this.notification.info('Cliente removido');
  }

  clearSearchResults(): void {
    this.searchResults = [];
    this.selectedClientId = null;
  }

  trackByClientId(_: number, client: Client): number {
    return client.id!;
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
        this.notification.success('Venda finalizada');
        this.isFinishing = false;
        this.saleData = sale;
        this.showSaleModal = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notification.error(err?.error?.message || 'Erro ao finalizar');
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
    if (confirmed) this.router.navigate(['/comandas']);
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }

  get previewChange(): number {
    return Math.max(0, this.newPaymentAmount - this.remaining);
  }
}
