import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { KitchenService } from '../../services/kitchen-display.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { KitchenOrder, Recipe } from '../../types/kitchen-display';
import { MockKitchenService } from '../../services/kitchen-mock.service';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule, ModalEditEntity],
  templateUrl: './kitchen-display.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenDisplay implements OnInit, OnDestroy {
  private kitchenService = inject(MockKitchenService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService); // 🔐 Injeta AuthService

  orders: KitchenOrder[] = [];
  selectedRecipe: Recipe | null = null;
  showRecipeModal: boolean = false;
  showKitchenConfigModal: boolean = false;
  isLoading: boolean = false;
  
  private refreshSubscription?: Subscription;
  private timeUpdateSubscription?: Subscription;

  // 🏪 Configuração de cozinha
  private readonly KITCHEN_STORAGE_KEY = 'default_kitchen';
  defaultKitchen: string | null = null;
  
  // Configuração do modal
  kitchenConfigEntity: any = { kitchen: '' };
  kitchenConfigFields: FormField[] = [
    {
      name: 'kitchen',
      label: 'Cozinha Padrão',
      type: 'select',
      placeholder: 'Selecione a cozinha',
      options: ['Todas as cozinhas', 'Cozinha 1', 'Cozinha 2', 'Cozinha 3'],
      required: false
    }
  ];

  ngOnInit(): void {
    this.loadKitchenConfig();
    this.loadOrders();
    this.setupAutoRefresh();
    this.setupTimeUpdates();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.timeUpdateSubscription?.unsubscribe();
  }

  // 🔐 Verifica se o usuário é admin
  get isAdmin(): boolean {
    const user = this.authService.getTokenPayload(); // Ou this.authService.getCurrentUser()
    return user?.role === 'admin';
  }

  // 🔄 Configuração de atualização automática (a cada 30 segundos)
  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadOrders();
    });
  }

  // ⏰ Atualização de tempo decorrido (a cada minuto)
  private setupTimeUpdates(): void {
    this.timeUpdateSubscription = interval(60000).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  // 🏪 Carrega configuração de cozinha do localStorage
  private loadKitchenConfig(): void {
    const saved = localStorage.getItem(this.KITCHEN_STORAGE_KEY);
    this.defaultKitchen = saved || null;
    this.kitchenConfigEntity.kitchen = saved || 'Todas as cozinhas';
  }

  // 💾 Salva configuração de cozinha no localStorage
  saveKitchenConfig(data: any): void {
    // 🔐 Verifica se é admin
    if (!this.isAdmin) {
      this.notification.error('Apenas administradores podem alterar a cozinha padrão');
      this.closeKitchenConfigModal();
      return;
    }

    const kitchen = data.kitchen;
    
    if (kitchen === 'Todas as cozinhas') {
      this.defaultKitchen = null;
      localStorage.removeItem(this.KITCHEN_STORAGE_KEY);
      this.notification.success('Exibindo pedidos de todas as cozinhas');
    } else {
      this.defaultKitchen = kitchen;
      localStorage.setItem(this.KITCHEN_STORAGE_KEY, kitchen);
      this.notification.success(`Cozinha padrão definida: ${kitchen}`);
    }
    
    this.closeKitchenConfigModal();
    this.loadOrders();
  }

  // 🔧 Abre modal de configuração de cozinha
  openKitchenConfigModal(): void {
    // 🔐 Verifica se é admin antes de abrir o modal
    if (!this.isAdmin) {
      this.notification.error('Apenas administradores podem configurar a cozinha padrão');
      return;
    }

    this.kitchenConfigEntity.kitchen = this.defaultKitchen || 'Todas as cozinhas';
    this.showKitchenConfigModal = true;
    this.cdr.markForCheck();
  }

  // ❌ Fecha modal de configuração de cozinha
  closeKitchenConfigModal(): void {
    this.showKitchenConfigModal = false;
    this.cdr.markForCheck();
  }

  // 🔍 Filtra pedidos por cozinha (se configurada)
  private filterOrdersByKitchen(orders: KitchenOrder[]): KitchenOrder[] {
    if (!this.defaultKitchen) {
      return orders;
    }
    return orders.filter(order => order.kitchen === this.defaultKitchen);
  }

  // 📊 Getters computados
  get pendingOrders(): KitchenOrder[] {
    return this.filterOrdersByKitchen(this.orders)
      .filter((o) => o.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  get preparingOrders(): KitchenOrder[] {
    return this.filterOrdersByKitchen(this.orders)
      .filter((o) => o.status === 'preparing')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  get readyOrders(): KitchenOrder[] {
    return this.filterOrdersByKitchen(this.orders)
      .filter((o) => o.status === 'ready')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // 🔍 TrackBy para otimização
  trackById(index: number, order: KitchenOrder): string {
    return order.id;
  }

  // ⏱️ Calcula tempo decorrido desde a criação do pedido
  getElapsedMinutes(order: KitchenOrder): number {
    const now = new Date();
    const created = new Date(order.createdAt);
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / 60000);
  }

  // 🎨 Classes de estilo baseadas no tempo
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

  // 📥 Carrega pedidos do backend
  loadOrders(): void {
    this.isLoading = true;
    this.kitchenService.getKitchenOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.error(`Erro ao carregar pedidos: ${error.error?.message || error.message}`);
        this.cdr.markForCheck();
      },
    });
  }

  // 🚀 Inicia preparo do pedido
  startPreparing(orderId: string): void {
    this.kitchenService.startPreparing(orderId).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex((o) => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        this.notification.success('Preparo iniciado!');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao iniciar preparo: ${error.error?.message || error.message}`);
      },
    });
  }

  // ✅ Marca pedido como pronto
  markAsReady(orderId: string): void {
    this.kitchenService.markAsReady(orderId).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex((o) => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        this.notification.success('Pedido marcado como pronto!');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao marcar como pronto: ${error.error?.message || error.message}`);
      },
    });
  }

  // 📦 Marca pedido como entregue
  completeOrder(orderId: string): void {
    this.kitchenService.markAsDelivered(orderId).subscribe({
      next: () => {
        this.orders = this.orders.filter((o) => o.id !== orderId);
        this.notification.success('Pedido entregue!');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao marcar como entregue: ${error.error?.message || error.message}`);
      },
    });
  }

  // 📖 Abre modal de receita
  openRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
    this.showRecipeModal = true;
    this.cdr.markForCheck();
  }

  // ❌ Fecha modal de receita
  closeRecipeModal(): void {
    this.showRecipeModal = false;
    this.selectedRecipe = null;
    this.cdr.markForCheck();
  }

  // 🔄 Atualiza manualmente a lista
  refreshOrders(): void {
    this.loadOrders();
  }

  // 🏠 Volta para o menu
  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
