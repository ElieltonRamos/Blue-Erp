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
import { CatalogService } from '../../../catalog-services/services/catalog.service';
import { UserService } from '../../../users/services/user.service';
import Client from '../../../clients/types/clients';
import { Product } from '../../../products/types/product';
import { Service } from '../../../catalog-services/types/catalog-types';
import User from '../../../users/types/user';
import { NotificationService } from '../../../../shared/toastr/notification.service';

type ItemType = 'PRODUCT' | 'SERVICE';

interface EditableItem {
  id?: number;
  type: ItemType;
  productId?: number;
  serviceId?: number;
  userId?: number | null;
  xProd: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface EditablePayment {
  method: string;
  amount: number;
}

interface SearchResult {
  type: ItemType;
  id: number;
  name: string;
  price: number;
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
  private catalogService = inject(CatalogService);
  private userService = inject(UserService);
  private notification = inject(NotificationService);

  paymentMethods = ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'CREDITO_LOJA'];

  selectedClientId!: number;
  clientSearch = '';
  clientResults: Client[] = [];
  showClientResults = false;

  itemSearch = '';
  itemResults: SearchResult[] = [];
  showItemResults = false;
  private itemSearchTimer: ReturnType<typeof setTimeout> | null = null;

  mechanics: User[] = [];

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
    this.discount = Number(this.saleData.discount);
    this.serviceCharge = Number(this.saleData.serviceCharge);
    this.isPaid = this.saleData.isPaid;
    this.cfop = this.saleData.cfop;

    this.items = (this.saleData.items ?? []).map((item) => ({
      id: item.id,
      type: item.serviceId ? 'SERVICE' : 'PRODUCT',
      productId: item.productId ?? undefined,
      serviceId: item.serviceId ?? undefined,
      userId: item.userId ?? null,
      xProd: item.xProd ?? '',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }));

    this.payments = this.saleData.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
    }));

    this.loadMechanics();
  }

  private loadMechanics(): void {
    this.userService.getUsers({ role: 'mechanic' }).subscribe({
      next: (users) => {
        this.mechanics = users;
      },
      error: () => {
        this.mechanics = [];
      },
    });
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

  // --- Busca unificada de produto/serviço ---
  onItemSearchChange(): void {
    if (this.itemSearchTimer) clearTimeout(this.itemSearchTimer);

    const term = this.itemSearch.trim();
    if (term.length < 2) {
      this.itemResults = [];
      this.showItemResults = false;
      return;
    }

    this.itemSearchTimer = setTimeout(() => {
      let productResults: SearchResult[] = [];
      let serviceResults: SearchResult[] = [];
      let pending = 2;

      const finish = () => {
        pending -= 1;
        if (pending === 0) {
          this.itemResults = [...productResults, ...serviceResults];
          this.showItemResults = true;
        }
      };

      this.productService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          productResults = response.data.map(
            (p): SearchResult => ({
              type: 'PRODUCT',
              id: p.id,
              name: p.name,
              price: Number(p.price),
            }),
          );
          finish();
        },
        error: () => finish(),
      });

      this.catalogService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          serviceResults = response.data.map(
            (s): SearchResult => ({
              type: 'SERVICE',
              id: s.id,
              name: s.name,
              price: Number(s.price),
            }),
          );
          finish();
        },
        error: () => finish(),
      });
    }, 350);
  }

  selectSearchResult(result: SearchResult): void {
    if (result.type === 'PRODUCT') {
      const existing = this.items.find((i) => i.type === 'PRODUCT' && i.productId === result.id);
      if (existing) {
        existing.quantity += 1;
        this.recalcItemTotal(existing);
      } else {
        this.items.push({
          type: 'PRODUCT',
          productId: result.id,
          xProd: result.name,
          quantity: 1,
          unitPrice: result.price,
          totalPrice: result.price,
        });
      }
    } else {
      this.items.push({
        type: 'SERVICE',
        serviceId: result.id,
        userId: null,
        xProd: result.name,
        quantity: 1,
        unitPrice: result.price,
        totalPrice: result.price,
      });
    }

    this.itemSearch = '';
    this.itemResults = [];
    this.showItemResults = false;
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
      type: item.type,
      productId: item.productId,
      serviceId: item.serviceId,
      userId: item.userId ?? undefined,
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

  get hasServiceItems(): boolean {
    return this.items.some((item) => item.type === 'SERVICE');
  }
}
