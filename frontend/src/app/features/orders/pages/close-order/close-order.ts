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

/* Services */
import { OrderService } from '../../services/order.service';
import { MockOrderService } from '../../services/order.mock.service';
import { ClientService } from '../../../clients/services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

/* Types */
import { Order, OrderItem, Product, PaymentMethod, FinishOrderDto } from '../../types/order';

import Client from '../../../clients/types/clients';

@Component({
  selector: 'app-close-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './close-order.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseOrder implements OnInit {
  /* =====================================================
   * INJECTIONS
   * ===================================================== */

  private readonly orderService = inject(MockOrderService);
  private readonly clientService = inject(ClientService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  /* =====================================================
   * ORDER
   * ===================================================== */

  order: Order | null = null;
  orderId = '';

  isLoading = false;
  isFinishing = false;

  /* =====================================================
   * SELLER
   * ===================================================== */

  sellerName = 'Vendedor';

  /* =====================================================
   * PAYMENT
   * ===================================================== */

  selectedPaymentMethod: PaymentMethod | null = null;

  subtotal = 0;
  discount = 0;
  total = 0;

  amountReceived = 0;

  paymentMethods = [
    { id: 'money' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
    { id: 'credit' as PaymentMethod, name: 'Crédito', icon: '💳' },
    { id: 'debit' as PaymentMethod, name: 'Débito', icon: '💳' },
    { id: 'pix' as PaymentMethod, name: 'PIX', icon: '📱' },
    { id: 'term' as PaymentMethod, name: 'Prazo', icon: '📅' },
  ];

  /* =====================================================
   * PRODUCTS
   * ===================================================== */

  searchCode = '';
  searchName = '';

  isSearchingProduct = false;

  /* =====================================================
   * CLIENT
   * ===================================================== */

  customerSearchId = '';
  customerSearchName = '';

  customerName = 'Cliente Avista';

  selectedClient: Client | null = {
    id: 1,
    name: 'Consumidor Final',
  } as Client;

  isSearchingClient = false;

  searchResults: Client[] = [];
  selectedClientId: number | null = null;

  /* =====================================================
   * FISCAL
   * ===================================================== */

  cfop = '5102';
  csosn = '102';

  /* =====================================================
   * LIFE CYCLE
   * ===================================================== */

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.orderId) {
      this.notification.error('ID do pedido não informado');
      this.router.navigate(['/pedidos']);
      return;
    }

    this.loadOrder();
  }

  /* =====================================================
   * ORDER
   * ===================================================== */

  private loadOrder(): void {
    this.isLoading = true;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;

        if (order.customerName) {
          this.customerName = order.customerName;
        }

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

  /* =====================================================
   * CLIENT
   * ===================================================== */

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

    this.customerName = client.name;

    this.customerSearchId = String(client.id);
    this.customerSearchName = client.name;

    this.notification.success(`Cliente ${client.name} selecionado`);
  }

  clearCustomer(): void {
    this.selectedClient = null;

    this.customerName = 'Cliente Avista';
    this.customerSearchId = '';
    this.customerSearchName = '';

    this.notification.info('Venda avista');
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

  /* =====================================================
   * PRODUCTS
   * ===================================================== */

  searchProduct(): void {
    if (!this.searchCode && !this.searchName) {
      this.notification.warning('Informe código ou nome');
      return;
    }

    this.isSearchingProduct = true;

    if (this.searchCode) {
      this.searchByCode();
      return;
    }

    this.searchByName();
  }

  private searchByCode(): void {
    this.orderService.getProductByCode(this.searchCode).subscribe({
      next: (product) => {
        this.addProductPrivate(product);

        this.isSearchingProduct = false;
        this.cdr.markForCheck();
      },

      error: () => {
        this.searchByName();
      },
    });
  }

  private searchByName(): void {
    this.orderService.searchProducts({ name: this.searchName }).subscribe({
      next: (products) => {
        if (!products.length) {
          this.notification.warning('Nenhum produto encontrado');
        } else {
          this.addProductPrivate(products[0]);
        }

        this.isSearchingProduct = false;
        this.cdr.markForCheck();
      },

      error: () => {
        this.notification.error('Erro na busca');

        this.isSearchingProduct = false;
        this.cdr.markForCheck();
      },
    });
  }

  addProduct(): void {
    this.searchProduct();
  }

  private addProductPrivate(product: Product): void {
    if (!this.order) return;

    const item: OrderItem = {
      id: Date.now().toString(),
      name: product.name,
      code: product.code,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
    };

    this.order.items.push(item);

    this.calculateTotals();
    this.clearProductForm();

    this.notification.success('Produto adicionado');
  }

  removeItem(id: string): void {
    if (!this.order) return;

    this.order.items = this.order.items.filter((i) => i.id !== id);

    this.calculateTotals();

    this.notification.success('Produto removido');
  }

  editItem(id: string): void {
    if (!this.order) return;

    const item = this.order.items.find((i) => i.id === id);

    if (!item) return;

    this.searchCode = item.code;
    this.searchName = item.name;

    this.removeItem(id);

    this.notification.info('Produto em edição');
  }

  private clearProductForm(): void {
    this.searchCode = '';
    this.searchName = '';
  }

  /* =====================================================
   * TOTALS
   * ===================================================== */

  calculateTotals(): void {
    if (!this.order) return;

    this.subtotal = this.order.items.reduce((sum, i) => sum + i.total, 0);

    this.total = this.subtotal - this.discount;

    if (this.selectedPaymentMethod !== 'money') {
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

    if (this.selectedPaymentMethod === 'money') {
      return this.amountReceived >= this.total;
    }

    return true;
  }

  /* =====================================================
   * PAYMENT
   * ===================================================== */

  selectPaymentMethod(method: PaymentMethod): void {
    if (method === 'term' && (!this.selectedClient || this.selectedClient.id === 1)) {
      this.notification.warning('Venda a prazo apenas para clientes cadastrados');
      return;
    }

    this.selectedPaymentMethod = method;

    this.amountReceived = method === 'money' ? 0 : this.total;

    this.cdr.markForCheck();
  }

  /* =====================================================
   * FINISH
   * ===================================================== */

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

    const payload: FinishOrderDto = {
      orderId: this.orderId,
      clientName: this.customerName,
      userOperator: this.sellerName,
      paymentMethod: this.selectedPaymentMethod,

      items: this.order.items,

      subtotal: this.subtotal,
      discount: this.discount,
      total: this.total,

      amountReceived: this.selectedPaymentMethod === 'money' ? this.amountReceived : this.total,

      change: this.selectedPaymentMethod === 'money' ? this.change : 0,

      cfop: this.cfop,
      csosn: this.csosn,
    };

    this.orderService.finalizeSale(payload).subscribe({
      next: (sale) => {
        this.notification.success('Venda finalizada');

        this.isFinishing = false;

        setTimeout(() => {
          this.router.navigate(['/vendas', sale.id]);
        }, 500);
      },

      error: (err) => {
        this.notification.error('Erro ao finalizar');

        this.isFinishing = false;
        this.cdr.markForCheck();
      },
    });
  }

  /* =====================================================
   * NAVIGATION
   * ===================================================== */

  cancelOrder(): void {
    if (confirm('Cancelar venda?')) {
      this.router.navigate(['/pedidos']);
    }
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
