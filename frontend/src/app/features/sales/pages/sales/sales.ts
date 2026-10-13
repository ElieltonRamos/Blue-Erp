import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ClientService } from '../../../clients/services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';

import Client from '../../../clients/types/clients';
import {
  Sale,
  SalePaymentDto,
  CreateDirectSaleDto,
  CartItem,
  CartItemType,
} from '../../types/sale';
import { FinishSale } from '../../components/finish-sale/finish-sale';
import { ModalEditProduct } from '../../components/modal-edit-product/modal-edit-product';
import { ModalSalesNote } from '../../components/modal-sales-note/modal-sales-note';
import { ProductService } from '../../../products/services/product.service';
import { SaleService } from '../../services/sales.service';
import { Product } from '../../../products/types/product';
import { CatalogService } from '../../../catalog-services/services/catalog.service';
import { Service } from '../../../catalog-services/types/catalog-types';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, FinishSale, ModalEditProduct, ModalSalesNote],
  templateUrl: './sales.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit, AfterViewInit {
  private readonly clientService = inject(ClientService);
  private readonly productService = inject(ProductService);
  private readonly saleService = inject(SaleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);

  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('quantityInput') quantityInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('productSearchInput') productSearchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('inputClientName') clientNameInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild(FinishSale) finishSaleRef?: FinishSale;

  sellerName = this.authService.getTokenPayload()?.username ?? 'Vendedor';
  selectedClientId: number | null = null;

  selectedClient: Client | null = null;
  searchResults: Client[] = [];
  customerSearchId = '';
  customerSearchName = '';
  isSearchingClient = false;

  product = { code: '', quantity: 1, price: 0, name: '' };

  subtotalValue = 0;
  discountValue = 0;
  totalValueDiscount = 0;
  payments: SalePaymentDto[] = [];

  showEditModal = false;
  selectedItem!: CartItem;

  showSaleModal = false;
  saleData: Sale | null = null;
  isFinalizing = false;
  resetCounter = 0;
  products: CartItem[] = [];

  searchTerm = '';
  searchItemsResults: CartItem[] = [];
  showSearchDropdown = false;
  activeSearchIndex = -1;
  selectedSearchItem: CartItem | null = null;
  private readonly search$ = new Subject<string>();

  saleCfop = '5102';
  saleCsosn = '102';
  showFiscalOptions = false;
  showShortcutsHelp = false;

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const trimmed = term.trim();
          if (!trimmed) return of([null, null] as const);
          return forkJoin([
            this.productService.getAll(1, 10, { search: trimmed }).pipe(catchError(() => of(null))),
            this.catalogService.getAll(1, 10, { search: trimmed }).pipe(catchError(() => of(null))),
          ]);
        }),
      )
      .subscribe(([productsRes, servicesRes]) => {
        const productItems = (productsRes?.data ?? []).map((p) => this.toCartItem(p, 'PRODUCT'));
        const serviceItems = (servicesRes?.data ?? []).map((s) => this.toCartItem(s, 'SERVICE'));
        this.searchItemsResults = [...productItems, ...serviceItems];
        this.activeSearchIndex = this.searchItemsResults.length ? 0 : -1;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.focusBarcodeInput();
  }

  private toCartItem(item: Product | Service, type: CartItemType, quantity = 1): CartItem {
    return { id: item.id, code: item.code, name: item.name, price: item.price, quantity, type };
  }

  selectClientFromResults(): void {
    const client = this.searchResults.find((c) => c.id === Number(this.selectedClientId));
    if (!client) return;
    this.setClient(client);
    this.searchResults = [];
    this.selectedClientId = null;
  }

  clearCustomer(): void {
    this.selectedClient = null;
    this.customerSearchId = '';
    this.customerSearchName = '';
    this.searchResults = [];
    this.selectedClientId = null;
    this.notification.info('Cliente removido');
    this.cdr.markForCheck();
  }

  get canFinishSale(): boolean {
    if (this.isFinalizing) return false;
    if (this.products.length === 0) return false;
    if (!this.saleCfop || this.saleCfop.length !== 4) return false;

    const totalPayments = this.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    return Math.abs(totalPayments - this.totalValueDiscount) <= 0.01;
  }

  // ── Busca de produto/serviço (autocomplete) ─────────────────────

  addSearchedItemToCart(): void {
    if (!this.selectedSearchItem) return;
    if (this.product.quantity <= 0) {
      this.notification.error('Informe uma quantidade válida!');
      return;
    }
    this.addItemToCart({ ...this.selectedSearchItem, quantity: this.product.quantity });
    this.searchTerm = '';
    this.selectedSearchItem = null;
  }

  onSearchBlur(): void {
    setTimeout(() => this.closeSearchDropdown(), 150);
  }

  closeSearchDropdown(): void {
    this.showSearchDropdown = false;
    this.searchItemsResults = [];
    this.activeSearchIndex = -1;
  }

  selectSearchedItem(item: CartItem): void {
    this.selectedSearchItem = item;
    this.product.code = item.code;
    this.product.name = item.name;
    this.product.price = item.price;
    this.closeSearchDropdown();
    setTimeout(() => this.quantityInputRef?.nativeElement.focus());
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.selectedSearchItem = null;
    this.showSearchDropdown = true;
    this.search$.next(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.showSearchDropdown || !this.searchItemsResults.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeSearchIndex = Math.min(
          this.activeSearchIndex + 1,
          this.searchItemsResults.length - 1,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeSearchIndex = Math.max(this.activeSearchIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeSearchIndex >= 0)
          this.selectSearchedItem(this.searchItemsResults[this.activeSearchIndex]);
        break;
      case 'Escape':
        this.closeSearchDropdown();
        break;
    }
  }

  searchProductByCode(): void {
    if (!this.product.code || this.product.quantity <= 0) {
      this.notification.error('Informe o código e quantidade válidos!');
      return;
    }

    const productHeavy = this.extractProductCodeAndWeight(this.product.code);
    if (productHeavy) {
      this.product.code = productHeavy.productCode;
      this.product.quantity = productHeavy.weightKg;
    }

    this.productService.getByCode(this.product.code).subscribe({
      next: (product) =>
        this.addItemToCart(this.toCartItem(product, 'PRODUCT', this.product.quantity)),
      error: (err) => this.notification.error(err?.error?.message || 'Produto não encontrado'),
    });
  }

  addItemToCart(item: CartItem): void {
    const existing = this.products.find((p) => p.id === item.id && p.type === item.type);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.products.push({ ...item });
    }

    this.updateSubtotalValue();
    this.product = { code: '', quantity: 1, price: 0, name: '' };
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  removeItem(item: CartItem): void {
    this.products = this.products.filter((p) => !(p.id === item.id && p.type === item.type));
    this.updateSubtotalValue();
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  editItem(item: CartItem): void {
    this.selectedItem = { ...item };
    this.showEditModal = true;
  }

  onSaveItem(updatedItem: CartItem): void {
    const index = this.products.findIndex((p) => p.id === updatedItem.id);
    if (index !== -1) {
      this.products[index] = updatedItem;
      this.updateSubtotalValue();
    }
    this.showEditModal = false;
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  onCancelEdit(): void {
    this.showEditModal = false;
    this.focusBarcodeInput();
  }

  private updateSubtotalValue(): void {
    this.subtotalValue = this.products.reduce((acc, p) => acc + p.price * p.quantity, 0);
    this.totalValueDiscount = Math.max(this.subtotalValue - this.discountValue, 0);
  }

  onDiscountChange(value: number): void {
    this.discountValue = value;
    this.totalValueDiscount = Math.max(this.subtotalValue - this.discountValue, 0);
    this.cdr.markForCheck();
  }

  onPaymentsChange(newPayments: SalePaymentDto[]): void {
    this.payments = newPayments;
    this.cdr.markForCheck();
  }

  // ── Cliente ─────────────────────

  findClientById(id: string): void {
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
      next: (client) => this.setClient(client),
      error: () => {
        this.notification.error('Cliente não encontrado');
        this.isSearchingClient = false;
        this.cdr.markForCheck();
      },
    });
  }

  findClientByName(name: string): void {
    if (!name) {
      this.notification.warning('Digite um nome');
      return;
    }

    this.isSearchingClient = true;
    this.clientService.findClientByName(name).subscribe({
      next: (clients) => {
        if (clients.length === 0) {
          this.notification.warning('Nenhum cliente encontrado');
        } else if (clients.length === 1) {
          this.setClient(clients[0]);
        } else {
          this.searchResults = clients;
        }
        this.isSearchingClient = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.notification.error('Erro ao buscar cliente');
        this.isSearchingClient = false;
        this.cdr.markForCheck();
      },
    });
  }

  private setClient(client: Client): void {
    this.selectedClient = client;
    this.searchResults = [];
    this.isSearchingClient = false;
    this.notification.success(`Cliente ${client.name} selecionado`);
    this.cdr.markForCheck();
  }

  // ── Atalhos / navegação ─────────────────────

  toggleFiscalOptions(): void {
    this.showFiscalOptions = !this.showFiscalOptions;
  }

  toggleShortcutsHelp(): void {
    this.showShortcutsHelp = !this.showShortcutsHelp;
  }

  focusBarcodeInput(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement?.focus());
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleEscape();
      return;
    }

    if (this.showEditModal || this.showSaleModal) return;

    switch (event.key) {
      case 'F1':
        event.preventDefault();
        this.focusBarcodeInput();
        break;
      case 'F2':
        event.preventDefault();
        this.productSearchInputRef?.nativeElement.focus();
        break;
      case 'F3':
        event.preventDefault();
        this.clientNameInputRef?.nativeElement.focus();
        break;
      case 'F4':
        event.preventDefault();
        this.finishSale();
        break;
      case 'F5':
        event.preventDefault();
        this.finishSaleRef?.focusMethodSelect();
        break;
      case 'F8':
        event.preventDefault();
        this.cancelSale();
        break;
    }
  }

  private handleEscape(): void {
    if (this.showEditModal) {
      this.onCancelEdit();
      return;
    }
    if (this.showSaleModal) {
      this.closeSaleModal();
      return;
    }
    if (this.showSearchDropdown) {
      this.closeSearchDropdown();
      return;
    }
    this.goToMenu();
  }

  goToMenu(): void {
    alertConfirm('Voltar para o menu? A venda será cancelada!').then((confirmed) => {
      if (confirmed) {
        this.resetSale();
        this.router.navigate(['/dashboard']);
      }
    });
  }

  cancelSale(): void {
    alertConfirm('Cancelar Venda').then((confirmed) => {
      if (confirmed) this.resetSale();
    });
  }

  private resetSale(): void {
    this.products = [];
    this.subtotalValue = 0;
    this.totalValueDiscount = 0;
    this.discountValue = 0;
    this.payments = [];
    this.saleCfop = '5102';
    this.saleCsosn = '102';
    this.selectedClient = null;
    this.product = { code: '', quantity: 1, price: 0, name: '' };
    this.searchTerm = '';
    this.selectedSearchItem = null;
    this.resetCounter++;
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  // ── Finalização ─────────────────────

  finishSale(): void {
    if (this.isFinalizing) return;

    if (this.products.length === 0) {
      this.notification.error('Adicione produtos à venda!');
      return;
    }

    if (!this.saleCfop || this.saleCfop.length !== 4) {
      this.notification.error('CFOP inválido! Deve conter 4 dígitos.');
      return;
    }

    const totalPayments = this.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    if (Math.abs(totalPayments - this.totalValueDiscount) > 0.01) {
      this.notification.error('A soma das formas de pagamento deve ser igual ao total da venda!');
      return;
    }

    const dto: CreateDirectSaleDto = {
      clientId: this.selectedClient?.id || 1,
      payments: this.payments,
      items: this.products.map((p) => ({
        productId: p.type === 'PRODUCT' ? p.id : undefined,
        serviceId: p.type === 'SERVICE' ? p.id : undefined,
        quantity: Number(p.quantity),
        unitPrice: Number(p.price),
      })),
      discount: this.discountValue,
      cfop: this.saleCfop,
    };

    console.log('DTO enviado:', JSON.stringify(dto, null, 2));
    console.log(
      'Tipos dos items:',
      dto.items.map((i) => ({
        quantity: typeof i.quantity,
        unitPrice: typeof i.unitPrice,
        unitPriceValue: i.unitPrice,
      })),
    );

    alertConfirm('Finalizar Venda?').then((confirmed) => {
      if (!confirmed) return;

      this.isFinalizing = true;
      this.saleService.createDirectSale(dto).subscribe({
        next: (sale) => {
          this.saleData = sale;
          this.showSaleModal = true;
          this.isFinalizing = false;
          this.resetSale();
        },
        error: (err) => {
          this.notification.error(err?.error?.message || 'Erro ao finalizar venda');
          this.isFinalizing = false;
          this.cdr.markForCheck();
        },
      });
    });
  }

  closeSaleModal(): void {
    this.showSaleModal = false;
    this.focusBarcodeInput();
  }

  private extractProductCodeAndWeight(
    ean13: string,
  ): { productCode: string; weightKg: number } | false {
    if (!/^\d{13}$/.test(ean13) || !ean13.startsWith('20')) return false;

    const productCode = parseInt(ean13.substring(2, 5), 10);
    const weightInGrams = parseInt(ean13.substring(5, 12), 10);
    if (isNaN(productCode) || isNaN(weightInGrams)) return false;

    return { productCode: productCode.toString(), weightKg: weightInGrams / 1000 };
  }
}
