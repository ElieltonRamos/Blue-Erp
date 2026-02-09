import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { KitchenOrder, Recipe } from '../../types/kitchen-display';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { AuthService } from '../../../../core/services/auth.service';
import { KitchenService } from '../../services/kitchen-display.service';
import { ProductionLocationsService } from '../../../users/services/location.service';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule, ModalEditEntity],
  templateUrl: './kitchen-display.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenDisplay implements OnInit, OnDestroy {
  private kitchenService = inject(KitchenService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private locationsService = inject(ProductionLocationsService);

  orders: KitchenOrder[] = [];
  selectedRecipe: Recipe | null = null;
  showRecipeModal: boolean = false;
  showKitchenConfigModal: boolean = false;
  isLoading: boolean = false;

  private refreshSubscription?: Subscription;
  private timeUpdateSubscription?: Subscription;

  // Configuração de cozinha
  private readonly KITCHEN_STORAGE_KEY = 'default_kitchen';
  defaultKitchen: string | null = null;

  // Opções de cozinha (carregadas dinamicamente)
  kitchenOptions: string[] = ['Todas as cozinhas'];

  // Configuração do modal
  kitchenConfigEntity: any = { kitchen: '' };
  kitchenConfigFields: FormField[] = [
    {
      name: 'kitchen',
      label: 'Cozinha Padrão',
      type: 'select',
      placeholder: 'Selecione a cozinha',
      options: [], // Será preenchido dinamicamente
      required: false,
    },
  ];

  ngOnInit(): void {
    this.loadKitchenOptions();
    this.loadKitchenConfig();
    this.loadOrders();
    this.setupAutoRefresh();
    this.setupTimeUpdates();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.timeUpdateSubscription?.unsubscribe();
  }

  get isAdmin(): boolean {
    const user = this.authService.getTokenPayload();
    return user?.role === 'admin';
  }

  /**
   * Carrega opções de cozinha do backend
   */
  private loadKitchenOptions(): void {
    this.locationsService.getAll().subscribe({
      next: (locations) => {
        // Mapeia locais para nomes amigáveis
        this.kitchenOptions = ['Todas as cozinhas', ...locations.map((loc) => loc.name)];

        // Atualiza opções do modal
        this.kitchenConfigFields[0].options = this.kitchenOptions;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar locais: ${e.error?.message || e.message}`);
        // Fallback para opções padrão em caso de erro
        this.kitchenOptions = ['Todas as cozinhas'];
        this.kitchenConfigFields[0].options = this.kitchenOptions;
      },
    });
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadOrders();
    });
  }

  private setupTimeUpdates(): void {
    this.timeUpdateSubscription = interval(60000).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private loadKitchenConfig(): void {
    const saved = localStorage.getItem(this.KITCHEN_STORAGE_KEY);
    this.defaultKitchen = saved || null;
    this.kitchenConfigEntity.kitchen = saved || 'Todas as cozinhas';
  }

  saveKitchenConfig(data: any): void {
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

  openKitchenConfigModal(): void {
    if (!this.isAdmin) {
      this.notification.error('Apenas administradores podem configurar a cozinha padrão');
      return;
    }

    this.kitchenConfigEntity.kitchen = this.defaultKitchen || 'Todas as cozinhas';
    this.showKitchenConfigModal = true;
    this.cdr.markForCheck();
  }

  closeKitchenConfigModal(): void {
    this.showKitchenConfigModal = false;
    this.cdr.markForCheck();
  }

  get pendingOrders(): KitchenOrder[] {
    return this.orders
      .filter((o) => o.status === 'pending')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  get preparingOrders(): KitchenOrder[] {
    return this.orders
      .filter((o) => o.status === 'preparing')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  get readyOrders(): KitchenOrder[] {
    return this.orders
      .filter((o) => o.status === 'ready')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  trackById(index: number, order: KitchenOrder): number {
    return order.orderId;
  }

  getElapsedMinutes(order: KitchenOrder): number {
    const now = new Date();
    const created = new Date(order.createdAt);
    const diff = now.getTime() - created.getTime();
    return Math.floor(diff / 60000);
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

  loadOrders(): void {
    this.isLoading = true;
    this.kitchenService.getKitchenOrders(this.defaultKitchen || undefined).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.notification.error(
          `Erro ao carregar pedidos: ${error.error?.message || error.message}`,
        );
        this.cdr.markForCheck();
      },
    });
  }

  startPreparing(order: KitchenOrder): void {
    this.kitchenService.startPreparing(order.orderId, order.items).subscribe({
      next: () => {
        this.notification.success('Preparo iniciado!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao iniciar preparo: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  markAsReady(order: KitchenOrder): void {
    this.kitchenService.markAsReady(order.orderId, order.items).subscribe({
      next: () => {
        this.notification.success('Pedido marcado como pronto!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao marcar como pronto: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  completeOrder(order: KitchenOrder): void {
    this.kitchenService.markAsDelivered(order.orderId, order.items).subscribe({
      next: () => {
        this.notification.success('Pedido entregue!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao marcar como entregue: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  cancelOrder(order: KitchenOrder): void {
    if (!confirm(`Cancelar pedido #${order.orderNumber}?`)) {
      return;
    }

    this.kitchenService.cancelOrder(order.orderId, order.items).subscribe({
      next: () => {
        this.notification.success('Pedido cancelado!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao cancelar pedido: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  openRecipe(recipe: Recipe): void {
    this.selectedRecipe = recipe;
    this.showRecipeModal = true;
    this.cdr.markForCheck();
  }

  closeRecipeModal(): void {
    this.showRecipeModal = false;
    this.selectedRecipe = null;
    this.cdr.markForCheck();
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
