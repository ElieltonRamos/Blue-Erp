import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderService, OrderItem, CreateOrderDto, Product } from '../../services/order.service';

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

  // Campos para busca e adição de produtos
  searchCode: string = '';
  searchName: string = '';
  productQuantity: number = 1;
  productUnitPrice: number = 0;
  isSearching: boolean = false;
  
  // Array de itens do pedido
  orderItems: OrderItem[] = [];

  formCreateOrder = new FormGroup({
    type: new FormControl<'dine_in' | 'delivery'>('dine_in', [Validators.required]),
    customerName: new FormControl<string>(''),
    table: new FormControl<string>(''),
    address: new FormControl<string>(''),
  });

  // Calcula o total dos itens
  get calculatedTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  // Observa mudanças no tipo de pedido
  ngOnInit() {
    this.formCreateOrder.get('type')?.valueChanges.subscribe((type) => {
      if (type === 'dine_in') {
        // Para pedidos na mesa, o campo address não é necessário
        this.formCreateOrder.get('address')?.clearValidators();
        this.formCreateOrder.get('table')?.setValidators([Validators.required]);
      } else {
        // Para delivery, o campo address é obrigatório
        this.formCreateOrder.get('address')?.setValidators([Validators.required]);
        this.formCreateOrder.get('table')?.clearValidators();
      }
      this.formCreateOrder.get('address')?.updateValueAndValidity();
      this.formCreateOrder.get('table')?.updateValueAndValidity();
    });
  }

  // Busca produto por código ou nome
  searchProduct() {
    if (!this.searchCode && !this.searchName) {
      this.notification.error('Digite um código ou nome para buscar');
      return;
    }

    this.isSearching = true;

    // Buscar por código de barras primeiro se fornecido
    if (this.searchCode) {
      this.orderService.getProductByCode(this.searchCode).subscribe({
        next: (product: Product) => {
          this.fillProductData(product);
          this.isSearching = false;
        },
        error: (error) => {
          // Se não encontrar por código, tenta buscar por nome
          if (this.searchName) {
            this.searchByName();
          } else {
            this.notification.error('Produto não encontrado com esse código');
            this.isSearching = false;
          }
        },
      });
    } else if (this.searchName) {
      this.searchByName();
    }
  }

  private searchByName() {
    this.orderService.searchProducts({ name: this.searchName }).subscribe({
      next: (products: Product[]) => {
        if (products.length === 0) {
          this.notification.error('Nenhum produto encontrado');
        } else if (products.length === 1) {
          this.fillProductData(products[0]);
        } else {
          // Se houver múltiplos produtos, você pode implementar um modal de seleção
          // Por enquanto, vamos pegar o primeiro
          this.fillProductData(products[0]);
          this.notification.info(`${products.length} produtos encontrados. Mostrando o primeiro.`);
        }
        this.isSearching = false;
      },
      error: (error) => {
        this.notification.error('Erro ao buscar produto');
        this.isSearching = false;
      },
    });
  }

  private fillProductData(product: Product) {
    this.searchCode = product.code;
    this.searchName = product.name;
    this.productUnitPrice = product.price;
    this.notification.success('Produto encontrado! Configure a quantidade.');
  }

  // Adiciona produto à lista
  addProduct() {
    if (!this.searchName && !this.searchCode) {
      this.notification.error('Busque um produto primeiro');
      return;
    }

    if (this.productQuantity <= 0) {
      this.notification.error('Quantidade deve ser maior que zero');
      return;
    }

    if (this.productUnitPrice <= 0) {
      this.notification.error('Preço unitário deve ser maior que zero');
      return;
    }

    const newItem: OrderItem = {
      id: this.generateId(),
      code: this.searchCode || 'N/A',
      name: this.searchName || 'Produto sem nome',
      quantity: this.productQuantity,
      unitPrice: this.productUnitPrice,
      total: this.productQuantity * this.productUnitPrice,
    };

    this.orderItems.push(newItem);
    this.notification.success('Produto adicionado ao pedido');

    // Limpar campos
    this.clearProductFields();
  }

  private clearProductFields() {
    this.searchCode = '';
    this.searchName = '';
    this.productQuantity = 1;
    this.productUnitPrice = 0;
  }

  // Remove item da lista
  removeItem(itemId: string) {
    this.orderItems = this.orderItems.filter(item => item.id !== itemId);
    this.notification.success('Produto removido');
  }

  // Edita item
  editItem(itemId: string) {
    const item = this.orderItems.find(i => i.id === itemId);
    if (item) {
      // Preencher campos para edição
      this.searchCode = item.code;
      this.searchName = item.name;
      this.productQuantity = item.quantity;
      this.productUnitPrice = item.unitPrice;
      
      // Remover item para re-adicionar editado
      this.removeItem(itemId);
      this.notification.info('Item carregado para edição');
    }
  }

  // Gera ID único simples
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
        customerName: formValue.customerName || undefined,
        items: this.orderItems,
        total: this.calculatedTotal,
      };

      // Adicionar campos específicos baseado no tipo
      if (formValue.type === 'dine_in') {
        newOrder.table = formValue.table || undefined;
      } else {
        newOrder.address = formValue.address || undefined;
      }

      this.orderService.createOrder(newOrder).subscribe({
        next: (response) => {
          this.notification.success(`Pedido ${response.id} criado com sucesso!`);
          
          // Resetar formulário
          this.formCreateOrder.reset({
            type: 'dine_in',
          });
          this.orderItems = [];
          
          // Navegar para a lista de pedidos ou página de detalhes
          setTimeout(() => {
            this.router.navigate(['/pedidos']);
          }, 1500);
        },
        error: (error) => {
          this.notification.error(
            `Erro ao criar pedido: ${error.error?.message || error.message}`,
          );
        },
      });
    } else {
      this.formCreateOrder.markAllAsTouched();
      this.notification.error('Preencha todos os campos obrigatórios');
    }
  }
}