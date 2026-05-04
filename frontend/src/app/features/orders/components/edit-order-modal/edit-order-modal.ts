import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal, PortalModule } from '@angular/cdk/portal';
import { Order, OrderItem, OrderStatus, Product } from '../../types/order';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-edit-order-modal',
  imports: [CommonModule, FormsModule, PortalModule],
  templateUrl: './edit-order-modal.html',
})
export class EditOrderModal implements AfterViewInit, OnDestroy, OnChanges {
  private notification = inject(NotificationService);
  private orderService = inject(OrderService);
  private overlay = inject(Overlay);
  private cdr = inject(ChangeDetectorRef);

  @Input() isOpen: boolean = false;
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<Order>();

  @ViewChild(CdkPortal) portal!: CdkPortal;

  isSaving: boolean = false;
  private overlayRef: OverlayRef | null = null;
  serviceChargeAmount: number = 0;

  searchCode = '';
  searchName = '';
  isSearchingProduct = false;
  searchResults: Product[] = [];
  serviceChargeEnabled = false;

  private readonly overlayConfig = new OverlayConfig({
    hasBackdrop: true,
    backdropClass: 'modal-backdrop-dark',
    panelClass: 'modal-panel',
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this.overlay.scrollStrategies.block(),
    maxWidth: '90vw',
    maxHeight: '90vh',
  });

  get hasInvalidObservations(): boolean {
    return (
      this.order?.items.some((item) => !item.observation || item.observation.trim().length < 2) ??
      false
    );
  }

  get isDefaultServiceCharge(): boolean {
    if (!this.order) return true; // <-- falta isso
    const defaultValue = parseFloat(
      (this.order.items.reduce((s, i) => s + i.total, 0) * 0.1).toFixed(2),
    );
    return parseFloat(this.serviceChargeAmount.toFixed(2)) === defaultValue;
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.openModal();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      const totalItems = this.order.items.reduce((s, i) => s + i.total, 0);
      this.serviceChargeEnabled = (this.order.serviceCharge ?? 0) > 0;
      this.serviceChargeAmount = this.serviceChargeEnabled
        ? (this.order.serviceCharge ?? totalItems * 0.1)
        : totalItems * 0.1;
    }

    if (changes['isOpen']) {
      if (this.isOpen && this.portal) {
        this.openModal();
      } else if (!this.isOpen) {
        this.closeModalInternal();
      }
    }
  }

  ngOnDestroy(): void {
    this.closeModalInternal();
  }

  toggleServiceCharge(): void {
    this.serviceChargeEnabled = !this.serviceChargeEnabled;
    this.distributeServiceCharge();
    this.cdr.detectChanges();
  }

  onServiceChargeInput(value: number): void {
    this.serviceChargeAmount = value;
    this.distributeServiceCharge();
  }

  distributeServiceCharge(): void {
    if (!this.order) return;

    if (!this.serviceChargeEnabled || this.serviceChargeAmount === 0) {
      this.order.items.forEach((item) => (item.serviceCharge = 0));
      this.order.serviceCharge = 0;
      return;
    }

    if (this.isDefaultServiceCharge) {
      // modo padrão: cada item calcula 10% do próprio total
      this.order.items.forEach((item) => {
        item.serviceCharge = parseFloat((item.total * 0.1).toFixed(2));
      });
    } else {
      // valor fixo: divide igualmente
      const perItem = parseFloat((this.serviceChargeAmount / this.order.items.length).toFixed(2));
      this.order.items.forEach((item) => (item.serviceCharge = perItem));
    }

    this.order.serviceCharge = this.order.items.reduce((s, i) => s + (i.serviceCharge ?? 0), 0);
  }

  private openModal(): void {
    this.serviceChargeEnabled = (this.order?.serviceCharge ?? 0) > 0;
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create(this.overlayConfig);

      this.overlayRef.backdropClick().subscribe(() => {
        this.closeModal();
      });

      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.closeModal();
        }
      });
    }

    if (this.portal && !this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.portal);
    }
  }

  private closeModalInternal(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  onTypeChange(): void {
    if (this.order && this.order.type === 'DELIVERY') {
      this.order.table = undefined;
    } else if (this.order && this.order.type === 'DINE_IN') {
      this.order.address = undefined;
    }
  }

  searchProduct(): void {
    if (!this.searchCode && !this.searchName) {
      this.notification.error('Digite um código ou nome para buscar');
      return;
    }

    this.isSearchingProduct = true;

    if (this.searchCode) {
      this.searchByCode();
    } else {
      this.searchByName();
    }
  }

  private searchByCode(): void {
    this.orderService.getByCode(this.searchCode).subscribe({
      next: (product: Product) => {
        if (product) {
          this.addProductToOrder(product);
          this.searchCode = '';
        } else {
          this.notification.error('Produto não encontrado');
        }
        this.isSearchingProduct = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Produto não encontrado');
        this.isSearchingProduct = false;
        this.cdr.detectChanges();
      },
    });
  }

  private searchByName(): void {
    this.orderService.getAll(1, 10, { search: this.searchName }).subscribe({
      next: (response) => {
        const products = response.data;

        if (!products || products.length === 0) {
          this.notification.error('Nenhum produto encontrado');
          this.searchResults = [];
        } else {
          this.searchResults = products;
        }
        this.isSearchingProduct = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao buscar produto');
        this.searchResults = [];
        this.isSearchingProduct = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectProduct(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedIndex = parseInt(select.value);

    if (!isNaN(selectedIndex) && selectedIndex >= 0) {
      const product = this.searchResults[selectedIndex];
      this.addProductToOrder(product);
      this.searchResults = [];
      this.searchName = '';
      select.selectedIndex = 0;
    }
  }

  private addProductToOrder(product: Product): void {
    if (!this.order) return;

    const existingItem = this.order.items.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
      this.notification.success('Quantidade atualizada');
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        code: product.code,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        serviceCharge: 0,
        observation: '',
      };
      this.order.items.push(newItem);
      this.notification.success('Produto adicionado');
    }

    this.calculateOrderTotal();
    this.clearProductForm();
    this.cdr.detectChanges();
  }

  private clearProductForm(): void {
    this.searchCode = '';
    this.searchName = '';
  }

  removeItem(index: number): void {
    if (!this.order) return;
    this.order.items.splice(index, 1);
    this.calculateOrderTotal();
  }

  updateQuantity(item: OrderItem, newQuantity: number): void {
    if (newQuantity > 0) {
      item.quantity = newQuantity;
      item.total = item.quantity * item.unitPrice;
      this.calculateOrderTotal();
      this.cdr.detectChanges();
    }
  }
  
  calculateOrderTotal(): void {
    if (!this.order) return;
    const prevDefault = this.isDefaultServiceCharge; // captura ANTES de atualizar o total
    this.order.total = this.order.items.reduce((sum, item) => sum + item.total, 0);
    if (prevDefault) {
      this.serviceChargeAmount = parseFloat((this.order.total * 0.1).toFixed(2));
    }
    this.distributeServiceCharge();
  }

  saveOrder(): void {
    if (!this.order || this.isSaving) return;

    const validationError = this.validateOrder();
    if (validationError) {
      this.notification.error(validationError);
      return;
    }

    this.isSaving = true;

    this.orderService.updateOrder(this.order.id, this.buildUpdateDto()).subscribe({
      next: (updatedOrder) => {
        this.notification.success('Pedido atualizado com sucesso');
        this.isSaving = false;
        this.orderUpdated.emit(updatedOrder);
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSaving = false;
        const errorMsg = error.error?.message || error.message || 'Erro ao atualizar pedido';
        this.notification.error(`Erro: ${errorMsg}`);
        this.cdr.detectChanges();
        this.closeModal();
      },
    });
  }

  private validateOrder(): string | null {
    const o = this.order!;
    if (!o.customerName?.trim()) return 'Nome do cliente é obrigatório';
    if (o.type === 'DINE_IN' && !o.table?.trim()) return 'Mesa é obrigatória para pedidos no local';
    if (o.type === 'DELIVERY' && !o.address?.trim()) return 'Endereço é obrigatório para delivery';
    if (this.hasInvalidObservations)
      return 'Preencha a observação de todos os itens (mínimo 2 caracteres)';
    return null;
  }

  private buildUpdateDto() {
    const o = this.order!;
    return {
      customerName: o.customerName,
      table: o.type === 'DINE_IN' ? o.table : undefined,
      address: o.type === 'DELIVERY' ? o.address : undefined,
      status: o.status,
      total: o.total,
      serviceCharge: o.serviceCharge,
      items: o.items.map((item) => ({
        ...(typeof item.id === 'number' && { id: item.id }),
        productId: item.productId,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        serviceCharge: item.serviceCharge ?? 0,
        observation: item.observation,
      })),
    };
  }

  closeModal(): void {
    this.close.emit();
  }

  onModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
