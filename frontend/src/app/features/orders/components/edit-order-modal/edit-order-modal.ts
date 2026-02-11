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

  searchCode = '';
  searchName = '';
  isSearchingProduct = false;
  searchResults: Product[] = [];

  private readonly overlayConfig = new OverlayConfig({
    hasBackdrop: true,
    backdropClass: 'modal-backdrop-dark',
    panelClass: 'modal-panel',
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this.overlay.scrollStrategies.block(),
    maxWidth: '90vw',
    maxHeight: '90vh',
  });

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.openModal();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
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

  private openModal(): void {
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
    this.notification.success('Produto removido');
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
    this.order.total = this.order.items.reduce((sum, item) => sum + item.total, 0);
  }

  saveOrder(): void {
    if (!this.order || this.isSaving) return;

    if (!this.order.customerName || this.order.customerName.trim() === '') {
      this.notification.error('Nome do cliente é obrigatório');
      return;
    }

    if (this.order.type === 'DINE_IN' && (!this.order.table || this.order.table.trim() === '')) {
      this.notification.error('Mesa é obrigatória para pedidos no local');
      return;
    }

    if (
      this.order.type === 'DELIVERY' &&
      (!this.order.address || this.order.address.trim() === '')
    ) {
      this.notification.error('Endereço é obrigatório para delivery');
      return;
    }

    // if (this.order.items.length === 0) {
    //   this.notification.error('Adicione pelo menos um item ao pedido');
    //   return;
    // }

    this.isSaving = true;

    const updateDto = {
      customerName: this.order.customerName,
      table: this.order.type === 'DINE_IN' ? this.order.table : undefined,
      address: this.order.type === 'DELIVERY' ? this.order.address : undefined,
      status: this.order.status,
      items: this.order.items.map((item) => ({
        ...(typeof item.id === 'number' && { id: item.id }),
        productId: item.productId,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      total: this.order.total,
    };

    this.orderService.updateOrder(this.order.id, updateDto).subscribe({
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
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
