import {
  Component,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { TableService } from '../services/table.service';
import { Table, TableStatus } from '../types/table';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { TableStats } from '../components/table-stats/table-stats';
import { TableCard } from '../components/table-card/table-card';
import { TableModalComponent } from '../components/table-modal/table.modal';
import { TabModal } from '../components/tab-modal/tab-modal';
import { TableProductModal } from '../components/table-product-modal/table-product-modal';
import {
  ProductionLocation,
  ProductionLocationsService,
} from '../../users/services/location.service';
import { FormField, ModalEditEntity } from '../../../shared/modal-edit-entity/modal-edit-entity';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../orders/services/order.service';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [
    CommonModule,
    TableStats,
    TableCard,
    TableModalComponent,
    TabModal,
    TableProductModal,
    ModalEditEntity,
    FormsModule,
  ],
  templateUrl: './table-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableManagement implements OnInit {
  private notification = inject(NotificationService);
  private tableService = inject(TableService);
  private orderService = inject(OrderService);
  private locationService = inject(ProductionLocationsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tables: Table[] = [];
  locations: ProductionLocation[] = [];
  showModal = false;
  showProductModal = false;
  showTabModal = false;
  modalType: 'add' | 'edit' | 'reserve' | 'occupy' = 'add';
  selectedTable: Table | null = null;
  selectedTableForProducts: Table | null = null;
  selectedLocation: number | null = null;
  serviceChargeValue: number = 0;
  showTransferModal = false;
  transferEntity: any = {};
  transferFields: FormField[] = [];
  selectedTableForTransfer: Table | null = null;
  tableNumberFilter: string = '';
  showReprintModal = false;
  reprintEntity: any = {};
  reprintFields: FormField[] = [];
  selectedTableForReprint: Table | null = null;

  statusColors: Record<TableStatus, string> = {
    AVAILABLE: 'bg-emerald-600 hover:bg-emerald-700',
    OCCUPIED: 'bg-rose-600 hover:bg-rose-700',
    RESERVED: 'bg-amber-600 hover:bg-amber-700',
  };

  statusLabels: Record<TableStatus, string> = {
    AVAILABLE: 'Disponível',
    OCCUPIED: 'Ocupada',
    RESERVED: 'Reservada',
  };

  ngOnInit() {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.locationService.getAll().subscribe({
      next: (locations) => {
        this.locations = locations;
        if (locations.length > 0) {
          this.selectedLocation = locations[0].id;
          this.getTables();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao buscar localizações: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  get filteredTables(): Table[] {
    if (!this.selectedLocation) return [];
    return this.tables.filter((t) => t.locationId === this.selectedLocation);
  }

  get totalTables(): number {
    return this.filteredTables.length;
  }

  get availableTables(): number {
    return this.filteredTables.filter((t) => t.status === 'AVAILABLE').length;
  }

  get occupiedTables(): number {
    return this.filteredTables.filter((t) => t.status === 'OCCUPIED').length;
  }

  get sortedTables(): Table[] {
    return [...this.filteredTables]
      .sort((a, b) => a.number - b.number)
      .filter((t) =>
        this.tableNumberFilter ? t.number.toString().includes(this.tableNumberFilter) : true,
      );
  }

  get tabTotal(): number {
    return (
      this.selectedTableForProducts?.order?.items?.reduce((sum, item) => sum + item.total, 0) || 0
    );
  }

  selectLocation(locationId: number): void {
    this.selectedLocation = locationId;
    this.tableNumberFilter = '';
    this.getTables();
  }

  // Gerenciamento de Modais
  openTableModal(type: 'add' | 'edit' | 'reserve' | 'occupy', table?: Table): void {
    this.modalType = type;
    this.selectedTable = table || null;
    this.showModal = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  openModalAdd(): void {
    this.openTableModal('add');
  }

  openModalEdit(table: Table): void {
    this.openTableModal('edit', table);
  }

  openModalReserve(table: Table): void {
    this.openTableModal('reserve', table);
  }

  openModalOccupy(table: Table): void {
    this.openTableModal('occupy', table);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTable = null;
    this.getTables();
  }

  onTableModalSave(): void {
    this.getTables();
  }

  // Modal de Produtos
  openProductModal(table: Table): void {
    if (!table.id) {
      this.notification.error('Mesa inválida');
      return;
    }

    this.tableService.getTableById(table.id).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.showProductModal = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao buscar mesa: ${error.error?.message || error.message}`);
      },
    });
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.selectedTableForProducts = null;
    this.getTables();
  }

  // Modal de Comanda
  openTabModal(table: Table): void {
    if (!table.id) {
      this.notification.error('Mesa inválida');
      return;
    }

    this.tableService.getTableById(table.id).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.serviceChargeValue = response.order?.serviceCharge ?? 0;
        this.showTabModal = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao buscar mesa: ${error.error?.message || error.message}`);
      },
    });
  }

  closeTabModal(): void {
    this.showTabModal = false;
    this.selectedTableForProducts = null;
    this.getTables();
  }

  // Ações de Mesa
  handleOccupy(table: Table): void {
    this.openModalOccupy(table);
  }

  handleDelete(table: Table): void {
    if (!table.id) {
      this.notification.error('Mesa inválida');
      return;
    }

    alertConfirm('Tem certeza que deseja excluir esta mesa?').then((result) => {
      if (result && table.id) {
        this.tableService.deleteTable(table.id).subscribe({
          next: () => {
            this.notification.success('Mesa excluída com sucesso!');
            this.getTables();
          },
          error: (error) => {
            this.notification.error(
              `Erro ao excluir mesa: ${error.error?.message || error.message}`,
            );
          },
        });
      }
    });
  }

  handleRelease(table: Table): void {
    if (!table.id) {
      this.notification.error('Mesa inválida');
      return;
    }

    if (table.order?.items && table.order.items.length > 0) {
      this.notification.warning('Finalize a comanda antes de liberar a mesa!');
      return;
    }

    alertConfirm('Tem certeza que deseja liberar esta mesa?').then((result) => {
      if (result && table.id) {
        this.tableService.releaseTable(table.id).subscribe({
          next: () => {
            this.notification.success('Mesa liberada com sucesso!');
            this.getTables();
          },
          error: (error) => {
            this.notification.error(
              `Erro ao liberar mesa: ${error.error?.message || error.message}`,
            );
          },
        });
      }
    });
  }

  closeTab(serviceCharge: number): void {
    if (!this.selectedTableForProducts?.id) {
      this.notification.error('Mesa não selecionada');
      return;
    }

    if (!this.selectedTableForProducts.order?.items?.length) {
      this.notification.warning('Não há produtos na comanda');
      return;
    }

    alertConfirm('Confirma o fechamento da comanda e liberação da mesa?').then((result) => {
      if (result && this.selectedTableForProducts?.id) {
        this.tableService.closeTab(this.selectedTableForProducts.id, serviceCharge).subscribe({
          next: (response) => {
            this.notification.success('Comanda fechada e mesa liberada com sucesso!');
            this.closeTabModal();
            this.getTables();

            setTimeout(() => {
              this.router.navigate(['/comandas', response.orderId]);
            }, 100);
          },
          error: (error) => {
            this.notification.error(
              `Erro ao fechar comanda: ${error.error?.message || error.message}`,
            );
          },
        });
      }
    });
  }

  // Serviços de Dados
  getTables(): void {
    this.tableService.getTables(this.selectedLocation ?? undefined).subscribe({
      next: (response) => {
        this.tables = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao buscar mesas: ${error.error?.message || error.message}`);
      },
    });
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }

  openTransferModal(table: Table): void {
    this.selectedTableForTransfer = table;
    this.transferEntity = { targetLocationCode: '', targetTableNumber: null };
    this.transferFields = [
      {
        name: 'targetLocationCode',
        label: 'Localização destino',
        type: 'select',
        options: this.locations.map((l) => l.code),
      },
      {
        name: 'targetTableNumber',
        label: 'Número da mesa destino',
        type: 'number',
        placeholder: 'Ex: 5',
      },
    ];
    this.showTransferModal = true;
    this.cdr.markForCheck();
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
    this.selectedTableForTransfer = null;
    this.transferEntity = {};
  }

  handleTransfer(entity: any): void {
    const orderId = this.selectedTableForTransfer?.order?.id;
    if (!orderId) {
      this.notification.error('Mesa sem comanda aberta');
      return;
    }

    alertConfirm(
      'Deseja transferir a comanda dessa mesa? Ao fazer isso a mesa é liberada e os itens serão adicionados à mesa de destino.',
    ).then((confirmed) => {
      if (!confirmed) return;

      this.tableService
        .transferTable(orderId, Number(entity.targetTableNumber), entity.targetLocationCode)
        .subscribe({
          next: (response) => {
            this.notification.success(response.message);
            this.closeTransferModal();
            this.getTables();
          },
          error: (error) => {
            this.notification.error(
              `Erro ao transferir mesa: ${error.error?.message || error.message}`,
            );
          },
        });
    });
  }

  openReprintModal(table: Table): void {
    this.selectedTableForReprint = table;
    this.reprintEntity = {};
    this.reprintFields = table.order!.items.map((item) => {
      this.reprintEntity[item.productId] = 0; // era item.quantity
      return {
        name: item.productId.toString(),
        label: item.name,
        type: 'number',
        placeholder: `Qtd atual: ${item.quantity}`,
      };
    });

    this.showReprintModal = true;
    this.cdr.markForCheck();
  }

  handleReprint(quantities: any): void {
    const items = this.selectedTableForReprint!.order!.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(quantities[item.productId]),
      observation: item.observation || '',
    })).filter((item) => item.quantity > 0);

    if (!items.length) {
      this.notification.warning('Nenhum item com quantidade válida');
      return;
    }

    alertConfirm(
      'Tem certeza que deseja reimprimir os itens selecionados? Essa ação enviará os itens novamente para a cozinha/bar. Confirme apenas se a impressão anterior não ocorreu ou está incompleta.',
    ).then((confirmed) => {
      if (!confirmed) return;

      this.orderService.reprint(this.selectedTableForReprint!.order!.id, { items }).subscribe({
        next: () => {
          this.notification.success('Pedido reimpresso!');
          this.showReprintModal = false;
          this.selectedTableForReprint = null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.notification.error(`Erro ao reimprimir: ${error.error?.message || error.message}`);
        },
      });
    });
  }
}
