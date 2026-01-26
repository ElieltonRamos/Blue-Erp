// finish-order.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type PaymentMethod = 'money' | 'credit' | 'debit' | 'pix' | 'term';

interface Order {
  id: string;
  customerName: string;
  seller: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
}

@Component({
  selector: 'app-finish-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './close-order.html',
})
export class CloseOrder implements OnInit {
  selectedPaymentMethod: PaymentMethod | null = null;
  amountReceived: number = 0;
  
  // Product search fields
  searchCode: string = '';
  searchName: string = '';
  
  // Fiscal fields (hidden in corner)
  cfop: string = '5102';
  csosn: string = '102';
  
  // Customer search
  customerSearchId: string = '1';
  customerSearchName: string = '';
  selectedCustomer: string = 'Cliente: Avista';

  order: Order = {
    id: '1',
    customerName: 'João Silva',
    seller: 'Elielton',
    items: [
      { id: '1', name: 'Refrigerante Lata 350ml', code: 'REF350', quantity: 2, unitPrice: 5.5, total: 11.0 },
      { id: '2', name: 'Hambúrguer Artesanal', code: 'HAM001', quantity: 1, unitPrice: 25.0, total: 25.0 },
      { id: '3', name: 'Batata Frita', code: 'BAT001', quantity: 1, unitPrice: 12.0, total: 12.0 },
    ],
    subtotal: 48.0,
    discount: 0,
    total: 48.0,
  };

  paymentMethods = [
    { id: 'money' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
    { id: 'credit' as PaymentMethod, name: 'Cartão de Crédito', icon: '💳' },
    { id: 'debit' as PaymentMethod, name: 'Cartão de Débito', icon: '💳' },
    { id: 'pix' as PaymentMethod, name: 'PIX', icon: '📱' },
    { id: 'term' as PaymentMethod, name: 'A Prazo', icon: '📅' },
  ];

  ngOnInit(): void {
    this.calculateOrderTotals();
  }

  calculateOrderTotals(): void {
    this.order.subtotal = this.order.items.reduce((sum, item) => sum + item.total, 0);
    this.order.total = this.order.subtotal - this.order.discount;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
    if (method !== 'money') {
      this.amountReceived = this.order.total;
    } else {
      this.amountReceived = 0;
    }
  }

  get change(): number {
    return this.amountReceived - this.order.total;
  }

  get isValidPayment(): boolean {
    if (!this.selectedPaymentMethod) return false;
    if (this.selectedPaymentMethod === 'money') {
      return this.amountReceived >= this.order.total;
    }
    return true;
  }

  searchProduct(): void {
    console.log('Buscar produto:', this.searchCode || this.searchName);
    // Simular busca de produto - em produção, chamar API
    if (this.searchCode || this.searchName) {
      // Exemplo: produto encontrado
      // Aqui você faria a chamada para a API e retornaria o produto
      const foundProduct = {
        code: this.searchCode || 'PROD001',
        name: this.searchName || 'Produto Encontrado',
        quantity: 1,
        unitPrice: 15.00,
        total: 15.00
      };
      
      // Adiciona automaticamente
      this.addProductToOrder(foundProduct);
    }
  }

  addProduct(): void {
    // Método manual para adicionar produto
    if (this.searchCode || this.searchName) {
      this.searchProduct();
    }
  }

  addProductToOrder(product: { code: string; name: string; quantity: number; unitPrice: number; total: number }): void {
    const newItem: OrderItem = {
      id: String(this.order.items.length + 1),
      name: product.name,
      code: product.code,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      total: product.total
    };
    
    this.order.items.push(newItem);
    this.calculateOrderTotals();
    this.clearProductForm();
    
    // Auto-update payment if not money
    if (this.selectedPaymentMethod && this.selectedPaymentMethod !== 'money') {
      this.amountReceived = this.order.total;
    }
  }

  clearProductForm(): void {
    this.searchCode = '';
    this.searchName = '';
  }

  removeItem(itemId: string): void {
    this.order.items = this.order.items.filter(item => item.id !== itemId);
    this.calculateOrderTotals();
    
    // Auto-update payment if not money
    if (this.selectedPaymentMethod && this.selectedPaymentMethod !== 'money') {
      this.amountReceived = this.order.total;
    }
  }

  editItem(itemId: string): void {
    const item = this.order.items.find(i => i.id === itemId);
    if (item) {
      this.searchCode = item.code;
      this.searchName = item.name;
      this.removeItem(itemId);
      // O usuário pode modificar e adicionar novamente
    }
  }

  updateDiscount(): void {
    this.order.total = this.order.subtotal - this.order.discount;
    
    // Auto-update payment if not money
    if (this.selectedPaymentMethod && this.selectedPaymentMethod !== 'money') {
      this.amountReceived = this.order.total;
    }
  }

  searchCustomerById(): void {
    console.log('Buscar cliente por ID:', this.customerSearchId);
    // Implementar busca de cliente por ID
    // API call aqui
  }

  searchCustomerByName(): void {
    console.log('Buscar cliente por nome:', this.customerSearchName);
    // Implementar busca de cliente por nome
    // API call aqui
  }

  finishOrder(): void {
    if (this.isValidPayment) {
      console.log('Pedido finalizado:', {
        orderId: this.order.id,
        customer: this.selectedCustomer,
        seller: this.order.seller,
        items: this.order.items,
        subtotal: this.order.subtotal,
        discount: this.order.discount,
        total: this.order.total,
        paymentMethod: this.selectedPaymentMethod,
        amountReceived: this.amountReceived,
        change: this.change,
        cfop: this.cfop,
        csosn: this.csosn
      });
      
      // Implementar lógica de finalização - chamar API
      alert('Pedido finalizado com sucesso!');
      
      // Resetar formulário ou navegar
      // this.router.navigate(['/orders']);
    }
  }

  cancelOrder(): void {
    console.log('Cancelar venda');
    // Implementar navegação de volta
    // this.router.navigate(['/orders']);
  }

  goToMenu(): void {
    console.log('Voltar para menu');
    // Implementar navegação
    // this.router.navigate(['/menu']);
  }
}