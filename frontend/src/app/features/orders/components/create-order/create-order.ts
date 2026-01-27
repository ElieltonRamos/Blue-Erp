import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OrderMockService } from '../../services/order.mock.service';

interface OrderItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Order {
  id: string;
  type: 'dine_in' | 'delivery';
  items: OrderItem[];
  status: 'open' | 'closed' | 'canceled';
  total: number;
  customerName?: string;
  table?: string;
}

@Component({
  selector: 'app-create-order',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-order.html',
  providers: [provideNgxMask()],
  standalone: true,
})
export class CreateOrder {
  private orderService = inject(OrderMockService);
  private notification = inject(NotificationService);

  // Campos para busca e adição de produtos
  searchCode: string = '';
  searchName: string = '';
  productQuantity: number = 1;
  productUnitPrice: number = 0;
  
  // Array de itens do pedido
  orderItems: OrderItem[] = [];

  formCreateOrder = new FormGroup({
    type: new FormControl('' as 'dine_in' | 'delivery', [Validators.required]),
    status: new FormControl('open' as 'open' | 'closed' | 'canceled', [Validators.required]),
    customerName: new FormControl('' as string | undefined),
    table: new FormControl('' as string | undefined),
  });

  // Calcula o total dos itens
  get calculatedTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.total, 0);
  }

  // Busca produto (simulado - você deve conectar com seu serviço real)
  searchProduct() {
    // Aqui você deve implementar a busca real no seu backend
    // Por enquanto, vou simular um produto encontrado
    if (this.searchCode || this.searchName) {
      // Simular produto encontrado
      this.notification.success('Produto encontrado! Configure quantidade e preço.');
      // Você pode pré-preencher productUnitPrice aqui se encontrar o produto
    } else {
      this.notification.error('Digite um código ou nome para buscar');
    }
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

  // Edita item (você pode implementar um modal ou form inline)
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

      const newOrder: Omit<Order, 'id'> = {
        type: this.formCreateOrder.value.type!,
        status: this.formCreateOrder.value.status!,
        total: this.calculatedTotal,
        customerName: this.formCreateOrder.value.customerName || undefined,
        table: this.formCreateOrder.value.table || undefined,
        items: this.orderItems,
      };

      this.orderService.createOrder(newOrder).subscribe({
        next: (response) => {
          this.notification.success(`Pedido ${response.id} criado com sucesso!`);
          this.formCreateOrder.reset({
            type: 'delivery',
            status: 'open',
          });
          this.orderItems = [];
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