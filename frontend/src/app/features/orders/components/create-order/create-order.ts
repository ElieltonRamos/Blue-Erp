import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService } from '../../services/order.service';
import { OrderItem, CreateOrderDto } from '../../types/order';
import { FilterProductParams, Product } from '../../../products/types/product';

@Component({
  selector: 'app-create-order',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-order.html',
  standalone: true,
})
export class CreateOrder {
  private orderService = inject(OrderService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  searchCode: string = '';
  searchName: string = '';
  isSearching: boolean = false;
  searchResults: Product[] = [];
  orderItems: OrderItem[] = [];

  formCreateOrder = new FormGroup({
    type: new FormControl<'DINE_IN' | 'DELIVERY'>('DINE_IN', [Validators.required]),
    locationId: new FormControl<string>('LOCAL_01', [Validators.required]),
    customerName: new FormControl<string>('', [Validators.required]),
    table: new FormControl<string>('', [Validators.required]),
    address: new FormControl<string>(''),
  });

  get calculatedTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  ngOnInit() {
    this.formCreateOrder.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'DINE_IN') {
        this.formCreateOrder.get('address')?.clearValidators();
        this.formCreateOrder.get('table')?.setValidators([Validators.required]);

        if (this.formCreateOrder.get('locationId')?.value === 'DELIVERY') {
          this.formCreateOrder.get('locationId')?.setValue('LOCAL_01');
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

  searchProduct() {
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
        if (product) {
          this.addProductToOrder(product);
          this.searchCode = '';
        } else {
          this.notification.error('Produto não encontrado');
        }
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Produto não encontrado');
        this.isSearching = false;
        this.cdr.detectChanges();
      },
    });
  }

  private searchByName(name: string) {
    const filters: FilterProductParams = { search: name };

    this.orderService.getAll(1, 10, filters).subscribe({
      next: (response) => {
        const products = response.data;

        if (!products || products.length === 0) {
          this.notification.error('Nenhum produto encontrado');
          this.searchResults = [];
        } else {
          this.searchResults = products;
        }
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao buscar produto');
        this.searchResults = [];
        this.isSearching = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectProduct(event: Event) {
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

  private addProductToOrder(product: Product) {
    const existingItem = this.orderItems.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.total = existingItem.quantity * existingItem.unitPrice;
      this.notification.success('Quantidade atualizada');
    } else {
      const newItem: OrderItem = {
        id: this.generateId(),
        productId: product.id,
        code: product.code,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
      };
      this.orderItems.push(newItem);
      this.notification.success('Produto adicionado');
    }
    this.cdr.detectChanges();
  }

  updateQuantity(itemId: string, newQuantity: number) {
    const item = this.orderItems.find((i) => i.id === itemId);
    if (item && newQuantity > 0) {
      item.quantity = newQuantity;
      item.total = item.quantity * item.unitPrice;
      this.cdr.detectChanges();
    }
  }

  removeItem(itemId: string) {
    this.orderItems = this.orderItems.filter((item) => item.id !== itemId);
    this.notification.success('Produto removido');
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  onSubmit() {
    if (this.formCreateOrder.valid) {
      if (this.orderItems.length === 0) {
        this.notification.error('Adicione pelo menos um produto ao pedido');
        return;
      }

      const formValue = this.formCreateOrder.value;

      const newOrder: CreateOrderDto = {
        type: formValue.type!,
        locationId: formValue.locationId as any,
        customerName: formValue.customerName || undefined,
        items: this.orderItems.map((item) => ({
          productId: item.productId,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
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

          this.formCreateOrder.reset({
            type: 'DINE_IN',
            locationId: 'LOCAL_01',
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
    } else {
      this.formCreateOrder.markAllAsTouched();
      this.notification.error('Preencha todos os campos obrigatórios');
    }
  }
}
