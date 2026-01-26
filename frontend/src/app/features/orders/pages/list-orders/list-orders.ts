// orders-listing.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type OrderType = 'dine_in' | 'delivery';
type OrderStatus = 'open' | 'closed' | 'canceled';

interface Order {
  id: string;
  type: OrderType;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  table?: string;
}

@Component({
  selector: 'app-orders-listing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-orders.html',
})
export class ListOrders implements OnInit {
  searchName: string = '';
  searchId: string = '';
  statusFilter: string = 'all';
  currentPage: number = 1;
  
  orders: Order[] = [
    {
      id: '#001',
      type: 'dine_in',
      customerName: 'João Silva',
      items: [
        { id: '1', name: 'Refrigerante Lata 350ml', quantity: 2, unitPrice: 5.50, total: 11.00 },
        { id: '2', name: 'Hambúrguer Artesanal', quantity: 1, unitPrice: 25.00, total: 25.00 }
      ],
      status: 'open',
      total: 36.00,
      table: 'Mesa 5'
    },
    {
      id: '#002',
      type: 'delivery',
      customerName: 'Maria Santos',
      items: [
        { id: '1', name: 'Pizza Margherita', quantity: 1, unitPrice: 45.00, total: 45.00 },
        { id: '2', name: 'Refrigerante 2L', quantity: 1, unitPrice: 8.00, total: 8.00 }
      ],
      status: 'open',
      total: 53.00
    },
    {
      id: '#003',
      type: 'dine_in',
      customerName: 'Carlos Oliveira',
      items: [
        { id: '1', name: 'Salada Caesar', quantity: 1, unitPrice: 18.00, total: 18.00 }
      ],
      status: 'closed',
      total: 18.00,
      table: 'Mesa 12'
    }
  ];

  ngOnInit(): void {
    // Inicialização se necessário
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(order => {
      const matchesName = order.customerName?.toLowerCase().includes(this.searchName.toLowerCase()) ?? true;
      const matchesId = order.id.toLowerCase().includes(this.searchId.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || order.status === this.statusFilter;
      return matchesName && matchesId && matchesStatus;
    });
  }

  getStatusLabel(status: OrderStatus): string {
    const labels = {
      open: 'Aberto',
      closed: 'Fechado',
      canceled: 'Cancelado'
    };
    return labels[status];
  }

  getStatusClass(status: OrderStatus): string {
    const styles = {
      open: 'bg-green-500/20 text-green-400 border border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      canceled: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    return styles[status];
  }

  editOrder(orderId: string): void {
    console.log('Editar pedido:', orderId);
    // Implementar lógica de edição
  }

  finishOrder(orderId: string): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'closed';
      console.log('Pedido finalizado:', orderId);
    }
  }

  cancelOrder(orderId: string): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'canceled';
      console.log('Pedido cancelado:', orderId);
    }
  }

  goToMenu(): void {
    console.log('Voltar para menu');
    // Implementar navegação
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    // Implementar lógica de próxima página
    this.currentPage++;
  }
}