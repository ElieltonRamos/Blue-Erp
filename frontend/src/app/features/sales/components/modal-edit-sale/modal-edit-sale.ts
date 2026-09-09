import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnInit,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sale, SalePaymentDto, UpdateSaleDto, UpdateSaleItemDto } from '../../types/sale';
import { SaleService } from '../../services/sales.service';
import { ClientService } from '../../../clients/services/client.service';
import { ProductService } from '../../../products/services/product.service';
import Client from '../../../clients/types/clients';
import { Product } from '../../../products/types/product';
import { NotificationService } from '../../../../shared/toastr/notification.service';

interface EditableItem {
  id?: number;
  productId: number;
  xProd: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface EditablePayment {
  method: string;
  amount: number;
}

@Component({
  selector: 'app-modal-edit-sale',
  imports: [FormsModule],
  templateUrl: './modal-edit-sale.html',
})
export class ModalEditSale implements OnInit {
  @Input() saleData!: Sale;
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private saleService = inject(SaleService);
  private clientService = inject(ClientService);
  private productService = inject(ProductService);
  private notification = inject(NotificationService);

  paymentMethods = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA'];

  selectedClientId!: number;
  clientSearch = '';
  clientResults: Client[] = [];
  showClientResults = false;

  productSearch = '';
  productResults: Product[] = [];
  showProductResults = false;

  items: EditableItem[] = [];
  payments: EditablePayment[] = [];
  discount = 0;
  serviceCharge = 0;
  isPaid = false;
  cfop = '';

  saving = false;

  @HostListener('document:keydown.escape')
  handleEscape() {
    this.close();
  }

  ngOnInit(): void {
    this.selectedClientId = this.saleData.clientId;
    this.clientSearch = this.saleData.client.name;
    this.discount = this.saleData.discount;
    this.serviceCharge = Number(this.saleData.serviceCharge);
    this.isPaid = this.saleData.isPaid;
    this.cfop = this.saleData.cfop;

    this.items = (this.saleData.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      xProd: item.xProd ?? '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }));

    this.payments = this.saleData.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }));
  }

  searchClients(): void {
    if (this.clientSearch.trim().length < 2) {
      this.clientResults = [];
      this.showClientResults = false;
      return;
    }

    this.clientService.findClientByName(this.clientSearch.trim()).subscribe({
      next: (clients) => {
        this.clientResults = clients;
        this.showClientResults = true;
      },
      error: () => this.notification.error('Erro ao buscar clientes'),
    });
  }

  selectClient(client: Client): void {
    this.selectedClientId = client.id!;
    this.clientSearch = client.name;
    this.showClientResults = false;
  }

  searchProducts(): void {
    if (this.productSearch.trim().length < 2) {
      this.productResults = [];
      this.showProductResults = false;
      return;
    }

    this.productService.getAll(1, 10, { search: this.productSearch.trim() }).subscribe({
      next: (response) => {
        this.productResults = response.data;
        this.showProductResults = true;
      },
      error: () => this.notification.error('Erro ao buscar produtos'),
    });
  }

  selectProduct(product: Product): void {
    const existing = this.items.find((i) => i.productId === product.id);

    if (existing) {
      existing.quantity += 1;
      this.recalcItemTotal(existing);
    } else {
      this.items.push({
        productId: product.id,
        xProd: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      });
    }

    this.productSearch = '';
    this.productResults = [];
    this.showProductResults = false;
  }

  recalcItemTotal(item: EditableItem): void {
    item.totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  addPayment(): void {
    this.payments.push({ method: 'DINHEIRO', amount: 0 });
  }

  removePayment(index: number): void {
    this.payments.splice(index, 1);
  }

  get itemsTotal(): number {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get totalAfterDiscount(): number {
    return this.itemsTotal - this.discount + this.serviceCharge;
  }

  get paymentsMismatch(): boolean {
    return Math.abs(this.paymentsTotal - this.totalAfterDiscount) > 0.01;
  }

  get paymentsTotal(): number {
    return this.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  save(): void {
    if (!this.selectedClientId) {
      this.notification.error('Selecione um cliente.');
      return;
    }
    if (this.items.length === 0) {
      this.notification.error('A venda precisa ter ao menos um item.');
      return;
    }
    if (this.payments.length === 0) {
      this.notification.error('A venda precisa ter ao menos um pagamento.');
      return;
    }
    if (this.paymentsMismatch) {
      this.notification.error(
        `O total de pagamentos (R$ ${this.paymentsTotal.toFixed(2)}) não confere com o total da venda (R$ ${this.totalAfterDiscount.toFixed(2)}).`,
      );
      return;
    }

    const itemsDto: UpdateSaleItemDto[] = this.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    const paymentsDto: SalePaymentDto[] = this.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }));

    const dto: UpdateSaleDto = {
      clientId: this.selectedClientId,
      items: itemsDto,
      payments: paymentsDto,
      discount: this.discount,
      serviceCharge: this.serviceCharge,
      isPaid: this.isPaid,
      cfop: this.cfop,
    };

    this.saving = true;

    this.saleService.updateSale(this.saleData.id, dto).subscribe({
      next: () => {
        this.saving = false;
        this.notification.success('Venda atualizada com sucesso.');
        this.saved.emit();
      },
      error: (e) => {
        this.saving = false;
        this.notification.error(
          `Erro ao atualizar venda: ${e.error?.message || 'Erro inesperado.'}`,
        );
      },
    });
  }

  close(): void {
    this.closeModal.emit();
  }
}
