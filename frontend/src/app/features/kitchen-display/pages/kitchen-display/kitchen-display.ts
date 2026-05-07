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
import {
  KitchenOrderItem,
  ProductionStatus,
  Recipe,
  PreparationStep,
} from '../../types/kitchen-display';
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
  private notificationSound = new Audio('notification.mp3');
  private refreshSubscription?: Subscription;
  private timeUpdateSubscription?: Subscription;
  private readonly KITCHEN_STORAGE_KEY = 'default_kitchen';

  orders: KitchenOrderItem[] = [];
  selectedRecipe: Recipe | null = null;
  selectedPreparationSteps: PreparationStep[] | null = null;
  selectedItemName: string | null = null;
  showRecipeModal: boolean = false;
  showPreparationStepsModal: boolean = false;
  showKitchenConfigModal: boolean = false;
  isLoading: boolean = false;
  defaultKitchen: string | null = null;
  kitchenOptions: string[] = ['Todas as cozinhas'];
  kitchenConfigEntity: any = { kitchen: '' };
  kitchenConfigFields: FormField[] = [
    {
      name: 'kitchen',
      label: 'Cozinha Padrão',
      type: 'select',
      placeholder: 'Selecione a cozinha',
      options: [],
      required: false,
    },
  ];

  ngOnInit(): void {
    this.notificationSound.volume = 0.5;
    this.loadKitchenOptions();
    this.loadKitchenConfig();
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

  private loadKitchenOptions(): void {
    this.locationsService.getAll().subscribe({
      next: (locations) => {
        this.kitchenOptions = ['Todas as cozinhas', ...locations.map((loc) => loc.name)];
        this.kitchenService.setLocationMap(locations);
        this.kitchenConfigFields[0].options = this.kitchenOptions;
        this.cdr.markForCheck();
        this.loadOrders();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar locais: ${e.error?.message || e.message}`);
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

  get pendingOrders(): KitchenOrderItem[] {
    return this.orders
      .filter((item) => item.productionStatus === ProductionStatus.PENDING)
      .sort((a, b) => new Date(a.pendingAt).getTime() - new Date(b.pendingAt).getTime());
  }

  get preparingOrders(): KitchenOrderItem[] {
    return this.orders
      .filter((item) => item.productionStatus === ProductionStatus.IN_PROGRESS)
      .sort((a, b) => new Date(a.pendingAt).getTime() - new Date(b.pendingAt).getTime());
  }

  get readyOrders(): KitchenOrderItem[] {
    return this.orders
      .filter((item) => item.productionStatus === ProductionStatus.COMPLETED)
      .sort((a, b) => new Date(a.pendingAt).getTime() - new Date(b.pendingAt).getTime());
  }

  trackById(index: number, item: KitchenOrderItem): number {
    return item.productionId;
  }

  getElapsedMinutes(item: KitchenOrderItem): number {
    const now = new Date();
    const created = new Date(new Date(item.pendingAt).toISOString().replace('Z', '-03:00'));
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

  private playNotificationSound(): void {
    try {
      this.notificationSound.play().catch((e) => {
        console.log('Não foi possível reproduzir o som:', e);
      });
    } catch (error) {
      console.log('Erro ao reproduzir som:', error);
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.kitchenService.getKitchenOrders(this.defaultKitchen || undefined).subscribe({
      next: (orders) => {
        const currentIds = new Set(this.orders.map((o) => o.productionId));
        const hasNewOrders = orders.some((o) => !currentIds.has(o.productionId));

        if (hasNewOrders) {
          this.playNotificationSound();
        }
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

  startPreparing(item: KitchenOrderItem): void {
    this.kitchenService.startPreparingItem(item.productionId).subscribe({
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

  markAsReady(item: KitchenOrderItem): void {
    this.kitchenService.completeItem(item.productionId).subscribe({
      next: () => {
        this.notification.success('Item marcado como pronto!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao marcar como pronto: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  completeOrder(item: KitchenOrderItem): void {
    this.kitchenService.deliverItem(item.productionId).subscribe({
      next: () => {
        this.notification.success('Item entregue!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao marcar como entregue: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  cancelOrder(item: KitchenOrderItem): void {
    if (!confirm(`Cancelar item ${item.name} do pedido ${item.orderNumber}?`)) {
      return;
    }

    this.kitchenService.cancelProduction(item.productionId).subscribe({
      next: () => {
        this.notification.success('Item cancelado!');
        this.loadOrders();
      },
      error: (error) => {
        this.notification.error(`Erro ao cancelar item: ${error.error?.message || error.message}`);
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

  openPreparationSteps(item: KitchenOrderItem): void {
    this.selectedPreparationSteps = item.preparationSteps || [];
    this.selectedItemName = item.name;
    this.showPreparationStepsModal = true;
    this.cdr.markForCheck();
  }

  closePreparationStepsModal(): void {
    this.showPreparationStepsModal = false;
    this.selectedPreparationSteps = null;
    this.selectedItemName = null;
    this.cdr.markForCheck();
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
