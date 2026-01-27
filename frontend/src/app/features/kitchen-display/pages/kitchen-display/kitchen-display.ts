// kitchen-display.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  recipe?: Recipe;
}

interface Recipe {
  title: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
}

type OrderStatus = 'pending' | 'preparing' | 'ready';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'delivery';
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  elapsedMinutes: number;
}

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen-display.html',
})
export class KitchenDisplay implements OnInit {
  orders: KitchenOrder[] = [
    {
      id: '1',
      orderNumber: '#001',
      table: 'Mesa 5',
      type: 'dine_in',
      items: [
        { 
          id: '1', 
          name: 'Hambúrguer Artesanal', 
          quantity: 2,
          recipe: {
            title: 'Hambúrguer Artesanal',
            prepTime: '15 minutos',
            ingredients: [
              '180g de carne moída premium',
              '1 pão brioche',
              '2 fatias de queijo cheddar',
              'Alface, tomate e cebola',
              'Molho especial da casa'
            ],
            steps: [
              'Tempere a carne com sal e pimenta',
              'Grelhe por 4 minutos de cada lado',
              'Adicione o queijo nos últimos 2 minutos',
              'Torre o pão na chapa',
              'Monte: pão, molho, alface, hambúrguer, queijo, tomate, cebola'
            ]
          }
        },
        { 
          id: '2', 
          name: 'Batata Frita', 
          quantity: 1,
          recipe: {
            title: 'Batata Frita',
            prepTime: '10 minutos',
            ingredients: [
              '300g de batata cortada em palito',
              'Óleo para fritura',
              'Sal a gosto'
            ],
            steps: [
              'Corte as batatas em palitos uniformes',
              'Seque bem com papel toalha',
              'Frite em óleo a 180°C por 5-7 minutos',
              'Escorra e tempere com sal'
            ]
          }
        },
        { id: '3', name: 'Refrigerante Lata', quantity: 2 }
      ],
      status: 'pending',
      timestamp: new Date(Date.now() - 5 * 60000),
      elapsedMinutes: 5
    },
    {
      id: '2',
      orderNumber: '#002',
      table: 'Mesa 12',
      type: 'dine_in',
      items: [
        { 
          id: '1', 
          name: 'Pizza Margherita', 
          quantity: 1, 
          notes: 'Sem cebola',
          recipe: {
            title: 'Pizza Margherita',
            prepTime: '20 minutos',
            ingredients: [
              'Massa de pizza',
              'Molho de tomate',
              'Mussarela de búfala',
              'Manjericão fresco',
              'Azeite extra virgem',
              'Sal e orégano'
            ],
            steps: [
              'Abra a massa até ficar fina',
              'Espalhe o molho de tomate',
              'Distribua a mussarela',
              'Leve ao forno a 250°C por 12-15 minutos',
              'Finalize com manjericão fresco e azeite'
            ]
          }
        },
        { 
          id: '2', 
          name: 'Salada Caesar', 
          quantity: 1,
          recipe: {
            title: 'Salada Caesar',
            prepTime: '8 minutos',
            ingredients: [
              'Alface romana',
              'Croutons',
              'Parmesão ralado',
              'Molho Caesar',
              'Peito de frango grelhado (opcional)'
            ],
            steps: [
              'Lave e seque a alface',
              'Corte em pedaços médios',
              'Adicione croutons e parmesão',
              'Regue com molho Caesar',
              'Finalize com frango grelhado se pedido'
            ]
          }
        }
      ],
      status: 'preparing',
      timestamp: new Date(Date.now() - 12 * 60000),
      elapsedMinutes: 12
    },
    {
      id: '3',
      orderNumber: '#003',
      type: 'delivery',
      items: [
        { 
          id: '1', 
          name: 'Lasanha Bolonhesa', 
          quantity: 1,
          recipe: {
            title: 'Lasanha Bolonhesa',
            prepTime: '45 minutos',
            ingredients: [
              'Massa de lasanha',
              'Molho bolonhesa',
              'Molho bechamel',
              'Queijo mussarela',
              'Queijo parmesão'
            ],
            steps: [
              'Monte camadas: molho bolonhesa, massa, bechamel',
              'Repita até preencher a forma',
              'Cubra com queijos',
              'Leve ao forno a 180°C por 35-40 minutos',
              'Deixe descansar 5 minutos antes de servir'
            ]
          }
        },
        { id: '2', name: 'Refrigerante 2L', quantity: 1 }
      ],
      status: 'preparing',
      timestamp: new Date(Date.now() - 18 * 60000),
      elapsedMinutes: 18
    },
    {
      id: '4',
      orderNumber: '#004',
      table: 'Mesa 8',
      type: 'dine_in',
      items: [
        { 
          id: '1', 
          name: 'Frango Grelhado', 
          quantity: 1,
          recipe: {
            title: 'Frango Grelhado',
            prepTime: '12 minutos',
            ingredients: [
              '200g de peito de frango',
              'Temperos: alho, limão, sal e pimenta',
              'Azeite'
            ],
            steps: [
              'Marine o frango por 30 minutos',
              'Grelhe em fogo médio-alto',
              'Cozinhe 6 minutos de cada lado',
              'Verifique se está bem cozido'
            ]
          }
        },
        { id: '2', name: 'Arroz e Feijão', quantity: 1 }
      ],
      status: 'ready',
      timestamp: new Date(Date.now() - 25 * 60000),
      elapsedMinutes: 25
    },
    {
      id: '5',
      orderNumber: '#005',
      table: 'Mesa 3',
      type: 'dine_in',
      items: [
        { 
          id: '1', 
          name: 'Spaghetti Carbonara', 
          quantity: 1,
          recipe: {
            title: 'Spaghetti Carbonara',
            prepTime: '18 minutos',
            ingredients: [
              '200g de spaghetti',
              '100g de bacon em cubos',
              '2 ovos',
              '50g de parmesão ralado',
              'Pimenta do reino'
            ],
            steps: [
              'Cozinhe o spaghetti al dente',
              'Frite o bacon até ficar crocante',
              'Misture ovos e parmesão em uma tigela',
              'Escorra a massa e misture com o bacon',
              'Desligue o fogo e adicione a mistura de ovos',
              'Mexa rapidamente e sirva com pimenta'
            ]
          }
        },
        { id: '2', name: 'Vinho Tinto', quantity: 1 }
      ],
      status: 'pending',
      timestamp: new Date(Date.now() - 3 * 60000),
      elapsedMinutes: 3
    }
  ];

  selectedRecipe: Recipe | null = null;
  showRecipeModal: boolean = false;

  ngOnInit(): void {
    // Atualizar tempo a cada minuto
    setInterval(() => {
      this.updateElapsedTime();
    }, 60000);
  }

  updateElapsedTime(): void {
    this.orders.forEach(order => {
      const now = new Date();
      const diff = now.getTime() - order.timestamp.getTime();
      order.elapsedMinutes = Math.floor(diff / 60000);
    });
  }

  get pendingOrders(): KitchenOrder[] {
    return this.orders
      .filter(o => o.status === 'pending')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  get preparingOrders(): KitchenOrder[] {
    return this.orders
      .filter(o => o.status === 'preparing')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  get readyOrders(): KitchenOrder[] {
    return this.orders
      .filter(o => o.status === 'ready')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  changeStatus(orderId: string, newStatus: OrderStatus): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      console.log(`Pedido ${order.orderNumber} alterado para ${newStatus}`);
    }
  }

  startPreparing(orderId: string): void {
    this.changeStatus(orderId, 'preparing');
  }

  markAsReady(orderId: string): void {
    this.changeStatus(orderId, 'ready');
  }

  completeOrder(orderId: string): void {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      console.log(`Pedido ${this.orders[index].orderNumber} concluído`);
      this.orders.splice(index, 1);
    }
  }

  getTimeClass(minutes: number): string {
    if (minutes < 10) return 'text-green-400';
    if (minutes < 20) return 'text-yellow-400';
    return 'text-red-400';
  }

  getTimeBadgeClass(minutes: number): string {
    if (minutes < 10) return 'bg-green-500/20 border-green-500/30';
    if (minutes < 20) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  }

  openRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
    this.showRecipeModal = true;
  }

  closeRecipeModal(): void {
    this.showRecipeModal = false;
    this.selectedRecipe = null;
  }
}