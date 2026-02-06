import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { PrimaryMaterialService } from '../../services/primary-material.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ModalUpdatePrimaryMaterial } from '../modal-edit-primary-material/modal-edit-primary-material';
import { PrimaryMaterial } from '../../types/primary-material';

@Component({
  selector: 'app-list-primary-material',
  imports: [CommonModule, FormsModule, PaginatorComponent, ModalUpdatePrimaryMaterial, ModalUpdatePrimaryMaterial],
  templateUrl: './list-primary-material.html',
})
export class ListPrimaryMaterial {
  private notification = inject(NotificationService);
  private primaryMaterialService = inject(PrimaryMaterialService);
  private cdr = inject(ChangeDetectorRef);

  listMaterials: PrimaryMaterial[] = [];
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  showModalEdit: boolean = false;
  editMaterial: PrimaryMaterial = {
    id: '',
    name: '',
    code: '',
    unit: 'UN',
    unitCost: 0,
    currentStock: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  searchTerm: string = '';
  searchCode: string = '';
  filterActive: string = 'active';
  filterLowStock: boolean = false;

  sortKey: string = 'id';
  sortAsc: boolean = true;

  ngOnInit() {
    this.getAllMaterials(this.page, this.limit);
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    this.page = 1;
    this.getAllMaterials(this.page, this.limit);
  }

  onSearchName() {
    this.page = 1;
    this.getAllMaterials(this.page, this.limit);
  }

  onSearchCodeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.searchByCode();
    }
  }

  searchByCode() {
    if (this.searchCode !== '') {
      this.getMaterialByCode();
    } else {
      this.getAllMaterials(1, 20);
    }
  }

  getMaterialByCode() {
    this.primaryMaterialService.getByCode(this.searchCode).subscribe({
      next: (response) => {
        this.listMaterials = [response];
        this.totalItems = 1;
        this.page = 1;
        this.limit = 1;
        this.totalPages = 1;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar material: ${e.error?.message || e.message}`);
        this.listMaterials = [];
        this.totalItems = 0;
      },
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchCode = '';
    this.filterLowStock = false;
    this.getAllMaterials(1, 20);
  }

  onFilterChange() {
    this.page = 1;
    this.getAllMaterials(this.page, this.limit);
  }

  getAllMaterials(page: number, limit: number) {
    const sortOrder = this.sortAsc ? 'asc' : 'desc';

    const filters = {
      search: this.searchTerm || undefined,
      active: this.filterActive === 'all' ? undefined : this.filterActive === 'active',
      lowStock: this.filterLowStock || undefined,
    };

    this.primaryMaterialService.getAll(page, limit, filters, this.sortKey, sortOrder).subscribe({
      next: (response) => {
        this.listMaterials = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar materiais: ${e.error?.message || e.message}`);
      },
    });
  }

  toggleMaterialStatus(material: PrimaryMaterial) {
    const action = material.active ? 'inativar' : 'ativar';
    const actionPast = material.active ? 'inativado' : 'ativado';

    alertConfirm(`Deseja ${action} o material "${material.name}"?`).then((result) => {
      if (result) {
        this.primaryMaterialService.update(material.id, { active: !material.active }).subscribe({
          next: () => {
            this.notification.success(`Material ${actionPast} com sucesso!`);
            this.getAllMaterials(this.page, this.limit);
          },
          error: (e) => {
            this.notification.error(`Erro ao atualizar material: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getAllMaterials(this.page, this.limit);
  }

  openModalEdit(material: PrimaryMaterial) {
    this.editMaterial = material;
    this.showModalEdit = true;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  calculateStockValue(material: PrimaryMaterial): number {
    return material.currentStock * material.unitCost;
  }

  getStockStatusClass(material: PrimaryMaterial): string {
    if (material.currentStock === 0) {
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    }
    if (material.minStock && material.currentStock <= material.minStock) {
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    }
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  }

  getStockStatusText(material: PrimaryMaterial): string {
    if (material.currentStock === 0) return 'Sem Estoque';
    if (material.minStock && material.currentStock <= material.minStock) return 'Baixo';
    return 'Normal';
  }

  isExpiringSoon(material: PrimaryMaterial): boolean {
    if (!material.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(material.expiryDate);
    const diffDays = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }

  isExpired(material: PrimaryMaterial): boolean {
    if (!material.expiryDate) return false;
    return new Date(material.expiryDate) < new Date();
  }
}
