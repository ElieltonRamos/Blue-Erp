import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { TableMockService } from '../services/TableMockService';
import { ProductTable, Table, TableProduct } from '../types/table';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { TableStats } from '../components/table-stats/table-stats';
import { TableCard } from '../components/table-card/table-card';
import { TableModalComponent } from '../components/table-modal/table.modal';
import { TabModal } from '../components/tab-modal/tab-modal';
import { TableProductModal } from '../components/table-product-modal/table-product-modal';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, TableStats, TableCard, TableModalComponent, TabModal, TableProductModal],
  templateUrl: './table-management.html',
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

  statusColors = {
    available: 'bg-emerald-600 hover:bg-emerald-700',
    occupied: 'bg-rose-600 hover:bg-rose-700',
    reserved: 'bg-amber-600 hover:bg-amber-700',
  };

  statusLabels = {
    available: 'Disponível',
    occupied: 'Ocupada',
    reserved: 'Reservada',
  };

  ngOnInit() {
    this.getTables();
    this.getProducts();
  }

  // 📊 Getters
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

  // 🚪 Modal Operations (simples)
  openTableModal(type: 'add' | 'edit' | 'reserve' | 'occupy', table?: Table) {
    this.modalType = type;

    if (table) {
      this.selectedTable = table;
    } else {
      this.selectedTable = null;
    }

    this.showModal = true;
  }

  onTableModalSave(table: Table) {
    this.getTables();
  }

  closeModal() {
    this.showModal = false;
    this.selectedTable = null;
    this.getTables();
  }

  // Wrappers
  openModalAdd() {
    this.openTableModal('add');
  }
  openModalEdit(table: Table) {
    this.openTableModal('edit', table);
  }
  openModalReserve(table: Table) {
    this.openTableModal('reserve', table);
  }
  openModalOccupy(table: Table) {
    this.openTableModal('occupy', table);
  }

  // 🆗 Event Handlers do TableCard
  handleOccupy(table: Table) {
    this.openModalOccupy(table);
  }
  
  handleDelete(table: Table) {
    alertConfirm('Excluir Mesa').then((result) => {
      if (result) {
        this.tableService.deleteTable(table.id!).subscribe({
          next: () => {
            this.notification.success('Mesa excluída!');
            this.getTables();
          },
          error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
        });
      }
    });
  }
  handleRelease(table: Table) {
    this.tableService.releaseTable(table.id!).subscribe({
      next: () => {
        this.notification.success('Mesa liberada!');
        this.getTables();
      },
      error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
    });
  }

  // 🛒 Product Modal
  openProductModal(table: Table) {
    this.tableService.getTableById(table.id!).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.showProductModal = true;
        this.cdr.detectChanges();
      },
      error: (e) =>
        this.notification.error(`Erro ao buscar mesa: ${e.error?.message || e.message}`),
    });
  }

  // 📋 Tab Modal
  openTabModal(table: Table) {
    this.tableService.getTableById(table.id!).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.showTabModal = true;
        this.cdr.detectChanges();
      },
      error: (e) =>
        this.notification.error(`Erro ao buscar mesa: ${e.error?.message || e.message}`),
    });
  }

  closeProductModal() {
    this.showProductModal = false;
    this.selectedTableForProducts = null;
    this.getTables();
  }

  closeTabModal() {
    this.showTabModal = false;
    this.selectedTableForProducts = null;
    this.getTables();
  }

  // 🛍️ Product Management
  addProductToTable(productId: number) {
    if (!this.selectedTableForProducts || !productId) return;

    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    const tableProduct: TableProduct = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      totalPrice: product.price,
    };

    this.tableService.addProductToTable(this.selectedTableForProducts.id!, tableProduct).subscribe({
      next: (response) => {
        this.selectedTableForProducts = response;
        this.notification.success('Produto adicionado!');
        this.cdr.detectChanges();
      },
      error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
    });
  }

  updateProductQuantity(productId: number, change: number) {
    if (!this.selectedTableForProducts) return;

    const product = this.selectedTableForProducts.products?.find((p) => p.id === productId);
    if (!product) return;

    const newQuantity = product.quantity + change;
    if (newQuantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    this.tableService
      .updateProductQuantity(this.selectedTableForProducts.id!, productId, newQuantity)
      .subscribe({
        next: (response) => {
          this.selectedTableForProducts = response;
          this.cdr.detectChanges();
        },
        error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
      });
  }

  removeProduct(productId: number) {
    if (!this.selectedTableForProducts) return;

    alertConfirm('Remover Produto').then((result) => {
      if (result) {
        this.tableService
          .removeProductFromTable(this.selectedTableForProducts!.id!, productId)
          .subscribe({
            next: (response) => {
              this.selectedTableForProducts = response;
              this.notification.success('Produto removido!');
              this.cdr.detectChanges();
            },
            error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
          });
      }
    });
  }

  // 💰 Close Tab
  closeTab() {
    if (!this.selectedTableForProducts) return;

    alertConfirm('Fechar Comanda e Liberar Mesa?').then((result) => {
      if (result) {
        this.tableService.closeTab(this.selectedTableForProducts!.id!).subscribe({
          next: (response) => {
            this.notification.success('Comanda fechada e mesa liberada!');
            this.closeTabModal();
            this.router.navigate(['/vendas', response.saleId]);
          },
          error: (e) => this.notification.error(`Erro: ${e.error?.message || e.message}`),
        });
      }
    });
  }

  // 🔄 Services
  getTables() {
    this.tableService.getTables().subscribe({
      next: (response) => {
        this.tables = response;
        this.cdr.detectChanges();
      },
      error: (e) =>
        this.notification.error(`Erro ao buscar mesas: ${e.error?.message || e.message}`),
    });
  }

  getProducts() {
    this.tableService.getProducts().subscribe({
      next: (response) => {
        this.products = response;
        this.cdr.detectChanges();
      },
      error: (e) =>
        this.notification.error(`Erro ao buscar produtos: ${e.error?.message || e.message}`),
    });
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
