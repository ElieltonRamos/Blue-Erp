import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { TableService } from '../services/table.service';
import { ProductTable, Table, TableProduct, TableStatus } from '../types/table';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { TableStats } from '../components/table-stats/table-stats';
import { TableCard } from '../components/table-card/table-card';
import { TableModalComponent } from '../components/table-modal/table.modal';
import { TabModal } from '../components/tab-modal/tab-modal';
import { TableProductModal } from '../components/table-product-modal/table-product-modal';
import { TableMockService } from '../services/table.mock.service';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, TableStats, TableCard, TableModalComponent, TabModal, TableProductModal],
  templateUrl: './table-management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableManagement {
  private notification = inject(NotificationService);
  private tableService = inject(TableMockService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tables: Table[] = [];
  products: ProductTable[] = [];
  showModal = false;
  showProductModal = false;
  showTabModal = false;
  modalType: 'add' | 'edit' | 'reserve' | 'occupy' = 'add';
  selectedTable: Table | null = null;
  selectedTableForProducts: Table | null = null;

  statusColors: Record<TableStatus, string> = {
    available: 'bg-emerald-600 hover:bg-emerald-700',
    occupied: 'bg-rose-600 hover:bg-rose-700',
    reserved: 'bg-amber-600 hover:bg-amber-700',
  };

  statusLabels: Record<TableStatus, string> = {
    available: 'Disponível',
    occupied: 'Ocupada',
    reserved: 'Reservada',
  };

  ngOnInit() {
    this.loadInitialData();
  }

  // 🔄 Carrega dados iniciais
  private loadInitialData(): void {
    this.getTables();
    this.getProducts();
  }

  // 📊 Getters computados (OnPush-safe)
  get totalTables(): number {
    return this.tables.length;
  }

  get availableTables(): number {
    return this.tables.filter((t) => t.status === 'available').length;
  }

  get occupiedTables(): number {
    return this.tables.filter((t) => t.status === 'occupied').length;
  }

  get sortedTables(): Table[] {
    return [...this.tables].sort((a, b) => a.number - b.number);
  }

  get tabTotal(): number {
    return this.selectedTableForProducts?.products?.reduce((sum, p) => sum + p.totalPrice, 0) || 0;
  }

  // 🔍 TrackBy para otimização de performance
  trackById(index: number, table: Table): number {
    return table.id!;
  }

  // 🚪 Gerenciamento de Modais
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

  onTableModalSave(table: Table): void {
    this.getTables();
  }

  // 🛒 Modal de Produtos
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

  // 📋 Modal de Comanda
  openTabModal(table: Table): void {
    if (!table.id) {
      this.notification.error('Mesa inválida');
      return;
    }

    this.tableService.getTableById(table.id).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
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

  // 🎬 Ações de Mesa
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

    // Validação: bloqueia release se tem produtos
    if (table.products && table.products.length > 0) {
      this.notification.warning('❌ Finalize a comanda antes de liberar a mesa!');
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

  // 🛍️ Gerenciamento de Produtos
  addProductToTable(productId: number): void {
    if (!this.selectedTableForProducts?.id || !productId) {
      this.notification.error('Dados inválidos');
      return;
    }

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      this.notification.error('Produto não encontrado');
      return;
    }

    const tableProduct: TableProduct = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
    };

    this.tableService.addProductToTable(this.selectedTableForProducts.id, tableProduct).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.notification.success('Produto adicionado com sucesso!');
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao adicionar produto: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  updateProductQuantity(productId: number, change: number): void {
    if (!this.selectedTableForProducts?.id) {
      this.notification.error('Mesa não selecionada');
      return;
    }

    const product = this.selectedTableForProducts.products?.find((p) => p.id === productId);
    if (!product) {
      this.notification.error('Produto não encontrado');
      return;
    }

    const newQuantity = product.quantity + change;

    // Se quantidade for 0 ou negativa, remove o produto
    if (newQuantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    this.tableService
      .updateProductQuantity(this.selectedTableForProducts.id, productId, newQuantity)
      .subscribe({
        next: (response) => {
          this.selectedTableForProducts = response;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.notification.error(
            `Erro ao atualizar quantidade: ${error.error?.message || error.message}`,
          );
        },
      });
  }

  removeProduct(productId: number): void {
    if (!this.selectedTableForProducts?.id) {
      this.notification.error('Mesa não selecionada');
      return;
    }

    alertConfirm('Tem certeza que deseja remover este produto?').then((result) => {
      if (result && this.selectedTableForProducts?.id) {
        this.tableService
          .removeProductFromTable(this.selectedTableForProducts.id, productId)
          .subscribe({
            next: (response) => {
              this.selectedTableForProducts = response;
              this.notification.success('Produto removido com sucesso!');
              this.cdr.markForCheck();
            },
            error: (error) => {
              this.notification.error(
                `Erro ao remover produto: ${error.error?.message || error.message}`,
              );
            },
          });
      }
    });
  }

  // 💰 Fechar Comanda
  closeTab(): void {
    if (!this.selectedTableForProducts?.id) {
      this.notification.error('Mesa não selecionada');
      return;
    }

    if (!this.selectedTableForProducts.products?.length) {
      this.notification.warning('Não há produtos na comanda');
      return;
    }

    alertConfirm('Confirma o fechamento da comanda e liberação da mesa?').then((result) => {
      if (result && this.selectedTableForProducts?.id) {
        this.tableService.closeTab(this.selectedTableForProducts.id).subscribe({
          next: (response) => {
            this.notification.success('Comanda fechada e mesa liberada com sucesso!');
            this.closeTabModal();
            this.getTables();

            // Navega para a página de vendas após fechar
            setTimeout(() => {
              this.router.navigate(['/vendas', response.saleId]);
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

  // 🔄 Serviços de Dados
  getTables(): void {
    this.tableService.getTables().subscribe({
      next: (response) => {
        this.tables = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(`Erro ao buscar mesas: ${error.error?.message || error.message}`);
      },
    });
  }

  getProducts(): void {
    this.tableService.getProducts().subscribe({
      next: (response) => {
        this.products = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.notification.error(
          `Erro ao buscar produtos: ${error.error?.message || error.message}`,
        );
      },
    });
  }

  // 🏠 Navegação
  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
