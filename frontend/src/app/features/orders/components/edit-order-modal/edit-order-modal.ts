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
import { Order, OrderItem, Product } from '../../types/order';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService } from '../../services/order.service';

interface PendingItem {
  productId: number;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  observation: string;
}

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

  private overlayRef: OverlayRef | null = null;
  serviceChargeAmount: number = 0;
  serviceChargeEnabled = false;

  searchCode = '';
  searchName = '';
  isSearchingProduct = false;
  searchResults: Product[] = [];

  pendingItem: PendingItem | null = null;
  isSavingItem = false;
  isSavingHeader = false;
  isSavingServiceCharge = false;

  private readonly overlayConfig = new OverlayConfig({
    hasBackdrop: true,
    backdropClass: 'modal-backdrop-dark',
    panelClass: 'modal-panel',
    positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: this.overlay.scrollStrategies.block(),
    maxWidth: '90vw',
    maxHeight: '90vh',
  });

  get isDefaultServiceCharge(): boolean {
    if (!this.order) return true;
    const defaultValue = parseFloat(
      (this.order.items.reduce((s, i) => s + i.total, 0) * 0.1).toFixed(2),
    );
    return parseFloat(this.serviceChargeAmount.toFixed(2)) === defaultValue;
  }

  ngAfterViewInit(): void {
    if (this.isOpen) this.openModal();
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

  private openModal(): void {
    this.serviceChargeEnabled = (this.order?.serviceCharge ?? 0) > 0;
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create(this.overlayConfig);
      this.overlayRef.backdropClick().subscribe(() => this.closeModal());
      this.overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') this.closeModal();
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

  // ---------- Header fields (customerName, table, address, status) ----------

  saveHeader(): void {
    if (!this.order || this.isSavingHeader) return;
    this.isSavingHeader = true;

    const dto = {
      customerName: this.order.customerName,
      table: this.order.type === 'DINE_IN' ? this.order.table : undefined,
      address: this.order.type === 'DELIVERY' ? this.order.address : undefined,
      status: this.order.status,
    };

    this.orderService.updateOrder(this.order.id, dto).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isSavingHeader = false;
        this.orderUpdated.emit(updatedOrder);
        this.notification.success('Pedido atualizado');
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingHeader = false;
        const msg = error.error?.message || error.message || 'Erro ao atualizar pedido';
        this.notification.error(msg);
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Product search ----------

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
          this.openPendingItem(product);
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
      this.openPendingItem(product);
      this.searchResults = [];
      this.searchName = '';
      select.selectedIndex = 0;
    }
  }

  // ---------- Pending item (new product or quantity increase) ----------

  openPendingItem(product: Product): void {
    this.pendingItem = {
      productId: product.id,
      code: product.code,
      name: product.name,
      unitPrice: product.price,
      quantity: 1,
      observation: '',
    };
  }

  openPendingIncrease(item: OrderItem): void {
    this.pendingItem = {
      productId: item.productId,
      code: item.code,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: 1,
      observation: '',
    };
  }

  cancelPendingItem(): void {
    this.pendingItem = null;
  }

  confirmPendingItem(): void {
    if (!this.order || !this.pendingItem || this.isSavingItem) return;

    if (!this.pendingItem.observation || this.pendingItem.observation.trim().length < 2) {
      this.notification.error('Observação obrigatória (mínimo 2 caracteres)');
      return;
    }

    this.isSavingItem = true;

    const dto = {
      items: [
        {
          productId: this.pendingItem.productId,
          code: this.pendingItem.code,
          name: this.pendingItem.name,
          quantity: this.pendingItem.quantity,
          unitPrice: this.pendingItem.unitPrice,
          observation: this.pendingItem.observation,
        },
      ],
    };

    this.orderService.addItems(this.order.id, dto).subscribe({
      next: (updatedOrder) => this.onItemsMutated(updatedOrder, 'Item adicionado'),
      error: (error) => this.onItemMutationError(error),
    });
  }

  // ---------- Quantity decrease / remove ----------

  decreaseQuantity(item: OrderItem): void {
    if (!this.order || this.isSavingItem || !item.id) return;
    this.removeItemQuantity(item, 1);
  }

  removeItem(item: OrderItem): void {
    if (!this.order || this.isSavingItem || !item.id) return;
    this.removeItemQuantity(item, item.quantity);
  }

  private removeItemQuantity(item: OrderItem, quantity: number): void {
    if (!this.order || !item.id) return;
    this.isSavingItem = true;

    const dto = { items: [{ id: item.id, quantity }] };

    this.orderService.removeItems(this.order.id, dto).subscribe({
      next: (updatedOrder) => this.onItemsMutated(updatedOrder, 'Item atualizado'),
      error: (error) => this.onItemMutationError(error),
    });
  }

  private onItemsMutated(updatedOrder: Order, successMsg: string): void {
    this.order = updatedOrder;
    this.pendingItem = null;
    this.isSavingItem = false;
    this.orderUpdated.emit(updatedOrder);
    this.notification.success(successMsg);

    if (this.serviceChargeEnabled && this.isDefaultServiceCharge) {
      this.pushDefaultServiceCharge();
    }

    this.cdr.detectChanges();
  }

  private onItemMutationError(error: any): void {
    this.isSavingItem = false;
    const msg = error.error?.message || error.message || 'Erro ao atualizar item';
    this.notification.error(msg);
    this.cdr.detectChanges();
  }

  // ---------- Service charge ----------

  toggleServiceCharge(): void {
    this.serviceChargeEnabled = !this.serviceChargeEnabled;
    if (!this.serviceChargeEnabled) {
      this.serviceChargeAmount = 0;
    } else {
      const totalItems = this.order?.items.reduce((s, i) => s + i.total, 0) ?? 0;
      this.serviceChargeAmount = parseFloat((totalItems * 0.1).toFixed(2));
    }
    this.pushServiceCharge();
  }

  onServiceChargeInput(value: number): void {
    this.serviceChargeAmount = value;
    this.pushServiceCharge();
  }

  private pushDefaultServiceCharge(): void {
    const totalItems = this.order?.items.reduce((s, i) => s + i.total, 0) ?? 0;
    this.serviceChargeAmount = parseFloat((totalItems * 0.1).toFixed(2));
    this.pushServiceCharge();
  }

  private pushServiceCharge(): void {
    if (!this.order || this.isSavingServiceCharge) return;
    this.isSavingServiceCharge = true;

    const dto = { enabled: this.serviceChargeEnabled, amount: this.serviceChargeAmount };

    this.orderService.updateServiceCharge(this.order.id, dto).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isSavingServiceCharge = false;
        this.orderUpdated.emit(updatedOrder);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isSavingServiceCharge = false;
        const msg = error.error?.message || error.message || 'Erro ao atualizar taxa de serviço';
        this.notification.error(msg);
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
