import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService } from '../../services/order.service';
import { OrderItem, CreateOrderDto } from '../../types/order';
import { FilterProductParams, Product } from '../../../products/types/product';
import { ProductionLocationsService } from '../../../users/services/location.service';
import { TableService } from '../../../table-management/services/table.service';
import { Table } from '../../../table-management/types/table';

@Component({
  selector: 'app-create-order',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-order.html',
  standalone: true,
})
export class CreateOrder implements OnInit {
  private orderService = inject(OrderService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private locationsService = inject(ProductionLocationsService);
  private tableService = inject(TableService);

  searchCode: string = '';
  searchName: string = '';
  isSearching: boolean = false;
  searchResults: Product[] = [];
  orderItems: OrderItem[] = [];
  productionLocations: { id: number; code: string; name: string }[] = [];
  availableTables: Table[] = [];

  formCreateOrder = new FormGroup({
    type: new FormControl<'DINE_IN' | 'DELIVERY'>('DINE_IN', [Validators.required]),
    locationId: new FormControl<string>('', [Validators.required]),
    customerName: new FormControl<string>('', [Validators.required]),
    table: new FormControl<string>('', [Validators.required]),
    address: new FormControl<string>(''),
  });

  get calculatedTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  get hasInvalidObservations(): boolean {
    return this.orderItems.some((item) => !item.observation || item.observation.trim().length < 2);
  }

  ngOnInit() {
    this.loadProductionLocations();
    this.setupTypeChangeListener();
    this.setupLocationChangeListener();
  }

  setupLocationChangeListener() {
    this.formCreateOrder.get('locationId')?.valueChanges.subscribe((locationId) => {
      if (locationId && this.formCreateOrder.get('type')?.value === 'DINE_IN') {
        this.loadAvailableTables(locationId);
      } else {
        this.availableTables = [];
      }
    });
  }

  loadAvailableTables(locationCode: string) {
    const location = this.productionLocations.find((l) => l.code === locationCode);
    if (!location) return;

    this.tableService.getTables(location.id).subscribe({
      next: (tables) => {
        this.availableTables = tables.filter((t) => t.status === 'AVAILABLE');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error('Erro ao carregar mesas');
      },
    });
  }

  loadProductionLocations() {
    this.locationsService.getAll().subscribe({
      next: (locations) => {
        this.productionLocations = locations.map((loc) => ({
          id: loc.id,
          code: loc.code,
          name: loc.name,
        }));

        if (this.productionLocations.length > 0 && !this.formCreateOrder.get('locationId')?.value) {
          const firstNonDelivery = this.productionLocations.find((loc) => loc.code !== 'DELIVERY');
          if (firstNonDelivery) {
            this.formCreateOrder.patchValue({ locationId: firstNonDelivery.code });
          }
        }

        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar locais: ${e.error?.message || e.message}`);
      },
    });
  }

  onCodeEnter() {
    if (this.searchCode.trim()) {
      this.searchProduct();
    }
  }

  onNameEnter() {
    if (this.searchName.trim()) {
      this.searchProduct();
    }
  }

  private setupTypeChangeListener() {
    this.formCreateOrder.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'DINE_IN') {
        this.formCreateOrder.get('address')?.clearValidators();
        this.formCreateOrder.get('table')?.setValidators([Validators.required]);

        if (this.formCreateOrder.get('locationId')?.value === 'DELIVERY') {
          const firstNonDelivery = this.productionLocations.find((loc) => loc.code !== 'DELIVERY');
          if (firstNonDelivery) {
            this.formCreateOrder.get('locationId')?.setValue(firstNonDelivery.code);
          }
        }
      } else {
        this.formCreateOrder.get('address')?.setValidators([Validators.required]);
        this.formCreateOrder.get('table')?.clearValidators();
        this.formCreateOrder.get('locationId')?.setValue('DELIVERY');
      }

      this.formCreateOrder.get('address')?.updateValueAndValidity();
      this.formCreateOrder.get('table')?.updateValueAndValidity();
    });
  }

  get availableLocations() {
    const type = this.formCreateOrder.get('type')?.value;

    if (type === 'DELIVERY') {
      return this.productionLocations.filter((loc) => loc.code === 'DELIVERY');
    }

    return this.productionLocations.filter((loc) => loc.code !== 'DELIVERY');
  }

  // =============================
  // PRODUCT SEARCH
  // =============================

  searchProduct() {
    if (this.isSearching) return;

    const code = this.searchCode.trim();
    const name = this.searchName.trim();

    if (!code && !name) {
      this.notification.error('Digite um código ou nome para buscar');
      return;
    }

    this.isSearching = true;

    if (code) {
      this.searchByCode(code);
    } else {
      this.searchByName(name);
    }
  }

  private searchByCode(code: string) {
    this.orderService.getByCode(code).subscribe({
      next: (product: Product) => {
        if (!product) {
          this.isSearching = false;
          this.notification.error('Produto não encontrado');
          this.cdr.detectChanges();
          return;
        }

        this.addOrIncrementProduct(product);
        this.searchCode = '';
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSearching = false;
        this.notification.error('Produto não encontrado');
        this.cdr.detectChanges();
      },
    });
  }

  private searchByName(name: string) {
    const filters: FilterProductParams = { search: name };

    this.orderService.getAll(1, 10, filters).subscribe({
      next: (response) => {
        const products = response.data ?? [];

        if (products.length === 0) {
          this.isSearching = false;
          this.notification.error('Nenhum produto encontrado');
          this.searchResults = [];
          this.cdr.detectChanges();
          return;
        }

        this.searchResults = products;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSearching = false;
        this.notification.error('Erro ao buscar produto');
        this.searchResults = [];
        this.cdr.detectChanges();
      },
    });
  }

  selectProduct(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedIndex = parseInt(select.value);

    if (!isNaN(selectedIndex) && selectedIndex >= 0) {
      const product = this.searchResults[selectedIndex];
      this.addOrIncrementProduct(product);

      this.searchResults = [];
      this.searchName = '';
      select.selectedIndex = 0;
    }
  }

  // =============================
  // CART LOGIC
  // =============================

  private addOrIncrementProduct(product: Product) {
    const existingItem = this.orderItems.find((item) => item.productId === product.id);

    if (existingItem) {
      this.orderItems = this.orderItems.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item,
      );
      this.notification.success('Quantidade atualizada');
      return;
    }

    const newItem: OrderItem = {
      productId: product.id,
      code: product.code,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
      observation: '',
    };

    this.orderItems = [...this.orderItems, newItem];
    this.notification.success('Produto adicionado');
  }

  updateQuantity(productId: number, newQuantity: number) {
    if (newQuantity <= 0) return;
    this.orderItems = this.orderItems.map((item) =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item,
    );
  }

  updateObservation(productId: number, observation: string) {
    this.orderItems = this.orderItems.map((item) =>
      item.productId === productId ? { ...item, observation } : item,
    );
  }

  removeItem(productId: number) {
    this.orderItems = this.orderItems.filter((item) => item.productId !== productId);
    this.notification.success('Produto removido');
  }

  // =============================
  // SUBMIT
  // =============================

  onSubmit() {
    if (!this.formCreateOrder.valid) {
      this.formCreateOrder.markAllAsTouched();
      this.notification.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (this.hasInvalidObservations) {
      this.notification.error('Preencha a observação de todos os itens (mínimo 2 caracteres)');
      return;
    }

    const formValue = this.formCreateOrder.value;

    const newOrder: CreateOrderDto = {
      type: formValue.type!,
      locationId: formValue.locationId!,
      customerName: formValue.customerName || undefined,
      items: this.orderItems.map((item) => ({
        productId: item.productId,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        observation: item.observation,
      })),
      total: this.calculatedTotal,
    };

    if (formValue.type === 'DINE_IN') {
      newOrder.table = formValue.table || undefined;
    } else {
      newOrder.address = formValue.address || undefined;
    }

    this.orderService.createOrder(newOrder).subscribe({
      next: (response) => {
        this.notification.success(`Pedido #${response.id} criado com sucesso!`);

        const firstNonDelivery = this.productionLocations.find((loc) => loc.code !== 'DELIVERY');

        this.formCreateOrder.reset({
          type: 'DINE_IN',
          locationId: firstNonDelivery?.code || '',
        });

        this.orderItems = [];
        this.searchCode = '';
        this.searchName = '';
        this.searchResults = [];

        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/pedidos']);
        }, 1500);
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.message || 'Erro desconhecido';
        this.notification.error(`Erro ao criar pedido: ${errorMsg}`);
      },
    });
  }
}
