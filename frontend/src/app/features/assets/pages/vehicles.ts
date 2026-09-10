import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginatorComponent } from '../../../shared/paginator/paginator.component';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { AssetService } from '../services/asset.service';
import { Asset, CreateAssetDTO, FilterAssetParams } from '../types/asset.type';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { ModalEditEntity, FormField } from '../../../shared/modal-edit-entity/modal-edit-entity';
import { ClientService } from '../../clients/services/client.service';
import Client from '../../clients/types/clients';

interface ClientGroup {
  clientId: number;
  clientName: string;
  assets: Asset[];
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  marca: 'Marca',
  modelo: 'Modelo',
  ano: 'Ano',
  km: 'Km',
};

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule, PaginatorComponent, ModalEditEntity],
  templateUrl: './vehicles.html',
})
export class Vehicles {
  private notification = inject(NotificationService);
  private assetService = inject(AssetService);
  private clientService = inject(ClientService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // --- Listagem ---
  listAssets: Asset[] = [];
  groupedAssets: ClientGroup[] = [];
  expandedClients = new Set<number>();

  page: number = 1;
  limit: number = 50;
  totalPages: number = 0;
  totalItems: number = 0;

  searchTerm: string = '';

  // --- Filtro por cliente (opcional) ---
  filterClientTerm: string = '';
  filterClientResults: Client[] = [];
  filterClient: Client | null = null;
  filterClientSearching: boolean = false;
  private filterClientTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Formulário de criação ---
  newAssetLabel: string = '';
  newAssetBrand: string = '';
  newAssetModel: string = '';
  newAssetYear: string = '';
  newAssetKm: string = '';
  creating: boolean = false;

  newClientTerm: string = '';
  newClientResults: Client[] = [];
  newClientSelected: Client | null = null;
  newClientSearching: boolean = false;
  private newClientTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Edição ---
  showEditModal: boolean = false;
  editingAsset: Asset | null = null;
  editEntity: any = {};
  editFields: FormField[] = [
    { name: 'label', label: 'Placa', type: 'text', placeholder: 'Ex: ABC-1234', required: true },
    { name: 'marca', label: 'Marca', type: 'text', placeholder: 'Ex: Fiat' },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ex: Uno' },
    { name: 'ano', label: 'Ano', type: 'text', placeholder: 'Ex: 2015' },
    { name: 'km', label: 'Km', type: 'text', placeholder: 'Ex: 85000' },
  ];

  ngOnInit() {
    this.loadAssets();
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  // --- Busca de cliente (form de criação) ---
  onNewClientTermChange() {
    this.newClientSelected = null;

    if (this.newClientTimer) clearTimeout(this.newClientTimer);

    const term = this.newClientTerm.trim();
    if (!term) {
      this.newClientResults = [];
      return;
    }

    this.newClientTimer = setTimeout(() => {
      this.newClientSearching = true;
      this.clientService.findClientByName(term).subscribe({
        next: (clients) => {
          this.newClientResults = clients;
          this.newClientSearching = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.newClientResults = [];
          this.newClientSearching = false;
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectNewClient(client: Client) {
    this.newClientSelected = client;
    this.newClientTerm = client.name;
    this.newClientResults = [];
  }

  // --- Busca de cliente (filtro da listagem) ---
  onFilterClientTermChange() {
    this.filterClient = null;

    if (this.filterClientTimer) clearTimeout(this.filterClientTimer);

    const term = this.filterClientTerm.trim();
    if (!term) {
      this.filterClientResults = [];
      this.page = 1;
      this.loadAssets();
      return;
    }

    this.filterClientTimer = setTimeout(() => {
      this.filterClientSearching = true;
      this.clientService.findClientByName(term).subscribe({
        next: (clients) => {
          this.filterClientResults = clients;
          this.filterClientSearching = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.filterClientResults = [];
          this.filterClientSearching = false;
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectFilterClient(client: Client) {
    this.filterClient = client;
    this.filterClientTerm = client.name;
    this.filterClientResults = [];
    this.page = 1;
    this.loadAssets();
  }

  clearFilterClient() {
    this.filterClient = null;
    this.filterClientTerm = '';
    this.filterClientResults = [];
    this.page = 1;
    this.loadAssets();
  }

  onSearchChange() {
    this.page = 1;
    this.loadAssets();
  }

  clearFilters() {
    this.searchTerm = '';
    this.clearFilterClient();
  }

  // --- Listagem ---
  loadAssets() {
    const filters: FilterAssetParams = {};

    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }

    if (this.filterClient?.id) {
      filters.clientId = this.filterClient.id;
    }

    this.assetService.getAll(this.page, this.limit, filters, 'clientId', 'asc').subscribe({
      next: (response) => {
        this.listAssets = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.groupAssetsByClient();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar veículos: ${e.error?.message || e.message}`);
      },
    });
  }

  private groupAssetsByClient() {
    const groups = new Map<number, ClientGroup>();

    for (const asset of this.listAssets) {
      if (!groups.has(asset.clientId)) {
        groups.set(asset.clientId, {
          clientId: asset.clientId,
          clientName: asset.clientName,
          assets: [],
        });
      }
      groups.get(asset.clientId)!.assets.push(asset);
    }

    this.groupedAssets = Array.from(groups.values());
  }

  toggleClientGroup(clientId: number) {
    if (this.expandedClients.has(clientId)) {
      this.expandedClients.delete(clientId);
    } else {
      this.expandedClients.add(clientId);
    }
  }

  isClientExpanded(clientId: number): boolean {
    return this.expandedClients.has(clientId);
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadAssets();
  }

  // --- Criação ---
  createAsset() {
    if (!this.newClientSelected) {
      this.notification.error('Selecione o cliente dono do veículo.');
      return;
    }

    if (!this.newAssetLabel.trim()) {
      this.notification.error('Informe a placa do veículo.');
      return;
    }

    const attributes = [
      { key: 'marca', value: this.newAssetBrand.trim() },
      { key: 'modelo', value: this.newAssetModel.trim() },
      { key: 'ano', value: this.newAssetYear.trim() },
      { key: 'km', value: this.newAssetKm.trim() },
    ].filter((a) => a.value !== '');

    const dto: CreateAssetDTO = {
      type: 'VEHICLE',
      label: this.newAssetLabel.trim(),
      clientId: this.newClientSelected.id!,
      attributes: attributes.length ? attributes : undefined,
    };

    this.creating = true;

    this.assetService.create(dto).subscribe({
      next: () => {
        this.notification.success('Veículo cadastrado com sucesso!');
        this.resetCreateForm();
        this.creating = false;
        this.page = 1;
        this.loadAssets();
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao cadastrar veículo: ${e.error?.message || e.message}`);
      },
    });
  }

  private resetCreateForm() {
    this.newAssetLabel = '';
    this.newAssetBrand = '';
    this.newAssetModel = '';
    this.newAssetYear = '';
    this.newAssetKm = '';
    this.newClientTerm = '';
    this.newClientSelected = null;
    this.newClientResults = [];
  }

  // --- Edição ---
  openEditModal(asset: Asset) {
    this.editingAsset = asset;

    const attrMap: Record<string, string> = {};
    for (const attr of asset.attributes) {
      attrMap[attr.key] = attr.value;
    }

    this.editEntity = {
      label: asset.label,
      marca: attrMap['marca'] || '',
      modelo: attrMap['modelo'] || '',
      ano: attrMap['ano'] || '',
      km: attrMap['km'] || '',
    };

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingAsset = null;
    this.editEntity = {};
  }

  onEditSave(data: any) {
    if (!this.editingAsset) return;

    if (!data.label || !String(data.label).trim()) {
      this.notification.error('Informe a placa do veículo.');
      return;
    }

    const attributes = [
      { key: 'marca', value: (data.marca || '').trim() },
      { key: 'modelo', value: (data.modelo || '').trim() },
      { key: 'ano', value: (data.ano || '').trim() },
      { key: 'km', value: (data.km || '').trim() },
    ].filter((a) => a.value !== '');

    this.assetService
      .update(this.editingAsset.id, {
        label: String(data.label).trim(),
        attributes,
      })
      .subscribe({
        next: () => {
          this.notification.success('Veículo atualizado com sucesso!');
          this.closeEditModal();
          this.loadAssets();
        },
        error: (e) => {
          this.notification.error(`Erro ao atualizar veículo: ${e.error?.message || e.message}`);
        },
      });
  }

  getAttributeLabel(key: string): string {
    return ATTRIBUTE_LABELS[key] || key;
  }
}
