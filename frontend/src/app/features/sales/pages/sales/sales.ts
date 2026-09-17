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
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ClientService } from '../../../clients/services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';


import Client from '../../../clients/types/clients';
import { Sale, SalePaymentDto, CreateDirectSaleDto } from '../../types/sale';
import { FinishSale } from '../../components/finish-sale/finish-sale';
import { CartProduct, ModalEditProduct } from '../../components/modal-edit-product/modal-edit-product';
import { ModalSalesNote } from '../../components/modal-sales-note/modal-sales-note';
import { ProductService } from '../../../products/services/product.service';
import { SaleService } from '../../services/sales.service';
import { Product } from '../../../products/types/product';

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

  @ViewChild('barcodeInput') barcodeInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('quantityInput') quantityInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('productSearchInput') productSearchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('inputClientName') clientNameInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild(FinishSale) finishSaleRef?: FinishSale;

  sellerName = 'Vendedor';

  selectedClient: Client | null = null;
  searchResults: Client[] = [];
  customerSearchId = '';
  customerSearchName = '';
  isSearchingClient = false;

  product = { code: '', quantity: 1, price: 0, name: '' };
  products: CartProduct[] = [];

  subtotalValue = 0;
  discountValue = 0;
  totalValueDiscount = 0;
  payments: SalePaymentDto[] = [];

  showEditModal = false;
  selectedItem!: CartProduct;

  showSaleModal = false;
  saleData: Sale | null = null;
  isFinalizing = false;

  saleCfop = '5102';
  saleCsosn = '102';
  showFiscalOptions = false;
  showShortcutsHelp = false;

  productSearchTerm = '';
  productSearchResults: Product[] = [];
  showProductDropdown = false;
  activeProductIndex = -1;
  selectedProduct: Product | null = null;
  private readonly productSearch$ = new Subject<string>();

  ngOnInit(): void {
    this.productSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) =>
          term.trim() ? this.productService.getAll(1, 10, { search: term }) : of(null),
        ),
      )
      .subscribe({
        next: (result) => {
          this.productSearchResults = result?.data ?? [];
          this.activeProductIndex = this.productSearchResults.length ? 0 : -1;
          this.cdr.markForCheck();
        },
        error: () => {
          this.productSearchResults = [];
          this.activeProductIndex = -1;
          this.cdr.markForCheck();
        },
      });
  }

  ngAfterViewInit(): void {
    this.focusBarcodeInput();
  }

  get canFinishSale(): boolean {
    if (this.isFinalizing) return false;
    if (this.products.length === 0) return false;
    if (!this.saleCfop || this.saleCfop.length !== 4) return false;

    const totalPayments = this.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    return Math.abs(totalPayments - this.totalValueDiscount) <= 0.01;
  }

  // ── Busca de produto (autocomplete) ─────────────────────

  onProductSearchInput(value: string): void {
    this.productSearchTerm = value;
    this.selectedProduct = null;
    this.showProductDropdown = true;
    this.productSearch$.next(value);
  }

  onProductSearchKeydown(event: KeyboardEvent): void {
    if (!this.showProductDropdown || !this.productSearchResults.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeProductIndex = Math.min(
          this.activeProductIndex + 1,
          this.productSearchResults.length - 1,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeProductIndex = Math.max(this.activeProductIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeProductIndex >= 0) {
          this.selectSearchedProduct(this.productSearchResults[this.activeProductIndex]);
        }
        break;
      case 'Escape':
        this.closeProductDropdown();
        break;
    }
  }

  selectSearchedProduct(item: Product): void {
    this.selectedProduct = item;
    this.product.code = item.code;
    this.product.name = item.name;
    this.product.price = item.price;
    this.closeProductDropdown();
    setTimeout(() => this.quantityInputRef?.nativeElement.focus());
  }

  closeProductDropdown(): void {
    this.showProductDropdown = false;
    this.productSearchResults = [];
    this.activeProductIndex = -1;
  }

  onProductSearchBlur(): void {
    setTimeout(() => this.closeProductDropdown(), 150);
  }

  addSearchedProductToCart(): void {
    if (!this.selectedProduct) return;
    if (this.product.quantity <= 0) {
      this.notification.error('Informe uma quantidade válida!');
      return;
    }
    this.addProductToCart(this.selectedProduct);
    this.productSearchTerm = '';
    this.selectedProduct = null;
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
      next: (product) => this.addProductToCart(product),
      error: (err) => this.notification.error(err?.error?.message || 'Produto não encontrado'),
    });
  }

  addProductToCart(product: Product): void {
    const existing = this.products.find((p) => p.code === product.code);

    if (existing) {
      existing.quantity += this.product.quantity;
    } else {
      this.products.push({ ...product, quantity: this.product.quantity });
    }

    this.updateSubtotalValue();
    this.product = { code: '', quantity: 1, price: 0, name: '' };
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  removeItem(item: CartProduct): void {
    this.products = this.products.filter((p) => p.id !== item.id);
    this.updateSubtotalValue();
    this.focusBarcodeInput();
    this.cdr.markForCheck();
  }

  editItem(item: CartProduct): void {
    this.selectedItem = { ...item };
    this.showEditModal = true;
  }

  onSaveItem(updatedItem: CartProduct): void {
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
    if (this.showProductDropdown) {
      this.closeProductDropdown();
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
    this.productSearchTerm = '';
    this.selectedProduct = null;
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
        productId: p.id,
        quantity: p.quantity,
        unitPrice: p.price,
      })),
      discount: this.discountValue,
      cfop: this.saleCfop,
    };

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
