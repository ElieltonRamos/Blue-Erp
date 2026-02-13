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
import { ConvertOrderToSaleDto } from '../../types/convert-order-sale';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';

export type PaymentMethod = 'DINHEIRO' | 'CARTAO' | 'PIX' | 'NOTINHA';

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
  selectedPaymentMethod: PaymentMethod | null = null;
  subtotal = 0;
  discount = 0;
  total = 0;
  amountReceived = 0;
  paymentMethods = [
    { id: 'DINHEIRO' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
    { id: 'CARTAO' as PaymentMethod, name: 'Crédito', icon: '💳' },
    { id: 'PIX' as PaymentMethod, name: 'PIX', icon: '📱' },
    { id: 'NOTINHA' as PaymentMethod, name: 'Prazo', icon: '📅' },
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

      error: (err) => {
        this.notification.error('Erro ao carregar pedido');
        this.isLoading = false;

        this.router.navigate(['/pedidos']);
      },
    });
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
        }

        if (clients.length === 0) {
          this.notification.warning('Nenhum cliente encontrado');
          this.clearSearchResults();
        }

        if (clients.length > 1) {
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

  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }

    return phone;
  }

  calculateTotals(): void {
    if (!this.order) return;

    this.subtotal = this.order.items.reduce((sum, i) => sum + i.total, 0);

    this.total = this.subtotal - this.discount;

    if (this.selectedPaymentMethod !== 'DINHEIRO') {
      this.amountReceived = this.total;
    }

    this.cdr.markForCheck();
  }

  updateDiscount(): void {
    this.calculateTotals();
  }

  get change(): number {
    return this.amountReceived - this.total;
  }

  get isValidPayment(): boolean {
    if (!this.selectedPaymentMethod) return false;

    if (this.selectedPaymentMethod === 'DINHEIRO') {
      return this.amountReceived >= this.total;
    }

    return true;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    if (method === 'NOTINHA' && !this.selectedClient) {
      this.notification.warning('Venda a prazo requer cliente cadastrado');
      return;
    }

    this.selectedPaymentMethod = method;

    this.amountReceived = method === 'DINHEIRO' ? 0 : this.total;

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

    if (!this.selectedPaymentMethod) {
      this.notification.error('Selecione pagamento');
      return;
    }

    this.isFinishing = true;

    const dto: ConvertOrderToSaleDto = {
      paymentMethod: this.selectedPaymentMethod.toUpperCase(),
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

    if (confirmed) {
      this.router.navigate(['/comandas']);
    }
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
