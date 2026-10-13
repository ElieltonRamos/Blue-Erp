import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginatorComponent } from '../../../shared/paginator/paginator.component';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { CatalogService } from '../services/catalog.service';
import { CreateServiceDTO, FilterServiceParams, Service } from '../types/catalog-types';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { ModalEditEntity, FormField } from '../../../shared/modal-edit-entity/modal-edit-entity';

@Component({
  selector: 'app-catalog-services',
  imports: [CommonModule, FormsModule, PaginatorComponent, ModalEditEntity],
  templateUrl: './catalog-services.html',
})
export class CatalogServices {
  private notification = inject(NotificationService);
  private catalogService = inject(CatalogService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  listServices: Service[] = [];
  page: number = 1;
  limit: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  searchTerm: string = '';
  filterActive: string = 'active';

  sortKey: string = 'name';
  sortAsc: boolean = true;

  newService: CreateServiceDTO = {
    name: '',
    price: 0,
    estimatedTime: undefined,
  };
  creating: boolean = false;

  showEditModal: boolean = false;
  editingService: Service | null = null;
  editEntity: any = {};
  editFields: FormField[] = [
    { name: 'name', label: 'Nome', type: 'text', placeholder: 'Ex: Troca de óleo', required: true },
    { name: 'price', label: 'Preço', type: 'number', placeholder: '0,00', required: true },
    { name: 'estimatedTime', label: 'Tempo estimado (min)', type: 'number', placeholder: '30' },
  ];

  ngOnInit() {
    this.loadServices();
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    this.page = 1;
    this.loadServices();
  }

  onSearchChange() {
    this.page = 1;
    this.loadServices();
  }

  onFilterChange() {
    this.page = 1;
    this.loadServices();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterActive = 'active';
    this.page = 1;
    this.loadServices();
  }

  loadServices() {
    const sortOrder = this.sortAsc ? 'asc' : 'desc';

    const filters: FilterServiceParams = {};

    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }

    if (this.filterActive === 'active') {
      filters.active = true;
    } else if (this.filterActive === 'inactive') {
      filters.active = false;
    }

    this.catalogService.getAll(this.page, this.limit, filters, this.sortKey, sortOrder).subscribe({
      next: (response) => {
        this.listServices = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar serviços: ${e.error?.message || e.message}`);
      },
    });
  }

  createService() {
    if (
      !this.newService.name ||
      this.newService.price === null ||
      this.newService.price === undefined
    ) {
      this.notification.error('Preencha nome e preço do serviço.');
      return;
    }

    this.creating = true;

    this.catalogService.create(this.newService).subscribe({
      next: () => {
        this.notification.success('Serviço criado com sucesso!');
        this.newService = { name: '', price: 0, estimatedTime: undefined };
        this.creating = false;
        this.page = 1;
        this.loadServices();
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao criar serviço: ${e.error?.message || e.message}`);
      },
    });
  }

  toggleServiceStatus(service: Service) {
    const action = service.active ? 'inativar' : 'ativar';
    const actionPast = service.active ? 'inativado' : 'ativado';

    alertConfirm(`Deseja ${action} o serviço "${service.name}"?`).then((result) => {
      if (result) {
        this.catalogService.update(service.id, { active: !service.active }).subscribe({
          next: () => {
            this.notification.success(`Serviço ${actionPast} com sucesso!`);
            this.loadServices();
          },
          error: (e) => {
            this.notification.error(`Erro ao atualizar serviço: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  openEditModal(service: Service) {
    this.editingService = service;
    this.editEntity = {
      name: service.name,
      price: service.price,
      estimatedTime: service.estimatedTime ?? undefined,
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingService = null;
    this.editEntity = {};
  }

  onEditSave(data: any) {
    if (!this.editingService) return;

    if (!data.name || data.price === null || data.price === undefined) {
      this.notification.error('Preencha nome e preço do serviço.');
      return;
    }

    this.catalogService
      .update(this.editingService.id, {
        name: data.name,
        price: data.price,
        estimatedTime: data.estimatedTime,
      })
      .subscribe({
        next: () => {
          this.notification.success('Serviço atualizado com sucesso!');
          this.closeEditModal();
          this.loadServices();
        },
        error: (e) => {
          this.notification.error(`Erro ao atualizar serviço: ${e.error?.message || e.message}`);
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadServices();
  }
}
