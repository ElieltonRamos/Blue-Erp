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
  @Input() isOpen: boolean = false;
  @Input() order: Order | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() orderUpdated = new EventEmitter<Order>();

  @ViewChild(CdkPortal) portal!: CdkPortal;

  isSaving: boolean = false;
  private orderService = inject(OrderService);
  private overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;
  private cdr = inject(ChangeDetectorRef);

  searchCode = '';
  searchName = '';
  isSearchingProduct = false;
  searchResults: Product[] = [];
  showSearchResults: boolean = false;
  statusOptions: OrderStatus[] = [];

  private readonly overlayConfig = new OverlayConfig({
    hasBackdrop: true,
    backdropClass: 'modal-backdrop-dark', // ✅ Use a classe definida no styles.scss
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
    // if (this.order && this.order.type === 'delivery') {
    //   this.order.table = undefined;
    // }
  }

  searchProduct(): void {
    if (!this.searchCode && !this.searchName) {
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
    // this.orderService.getProductByCode(this.searchCode).subscribe({
    //   next: (product) => {
    //     this.addProductToOrder(product);
    //     this.isSearchingProduct = false;
    //     this.cdr.detectChanges();
    //   },
    //   error: () => {},
    // });
  }

  private searchByName(): void {
    // this.orderService.searchProducts({ name: this.searchName }).subscribe({
    //   next: (products) => {
    //     if (products.length === 0) {
    //       // Nenhum produto encontrado
    //       this.notification.error('Nenhum produto encontrado');
    //       this.isSearchingProduct = false;
    //     } else if (products.length === 1) {
    //       // Apenas 1 produto: adiciona diretamente
    //       this.addProductToOrder(products[0]);
    //       this.isSearchingProduct = false;
    //     } else {
    //       // Múltiplos produtos: exibe lista para seleção
    //       this.searchResults = products;
    //       this.showSearchResults = true;
    //       this.isSearchingProduct = false;
    //     }
    //     this.cdr.detectChanges();
    //   },
    //   error: () => {
    //     this.isSearchingProduct = false;
    //     this.notification.error('Erro ao buscar produto');
    //   },
    // });
  }

  selectProductFromResults(product: Product): void {
    this.addProductToOrder(product);
    this.closeSearchResults();
  }

  closeSearchResults(): void {
    this.searchResults = [];
    this.showSearchResults = false;
  }

  private addProductToOrder(product: Product): void {
    if (!this.order) return;

    const newItem = {
      id: Date.now().toString(),
      code: product.code,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
    };

    // this.order.items.push(newItem);
    this.calculateOrderTotal();
    this.clearProductForm();
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

  calculateItemTotal(item: OrderItem): void {
    item.total = item.quantity * item.unitPrice;
    this.calculateOrderTotal();
  }

  calculateOrderTotal(): void {
    if (!this.order) return;
    this.order.total = this.order.items.reduce((sum, item) => sum + item.total, 0);
  }

  saveOrder(): void {
    if (!this.order || this.isSaving) return;

    this.isSaving = true;

    this.orderService.updateOrder(this.order.id, this.order).subscribe({
      next: (updatedOrder) => {
        this.isSaving = false;
        this.orderUpdated.emit(updatedOrder);
        this.closeModal();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erro ao atualizar pedido:', error);
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
