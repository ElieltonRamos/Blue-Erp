import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginatorComponent } from '../../../shared/paginator/paginator.component';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { DocumentService } from '../services/document.service';

import { ClientService } from '../../clients/services/client.service';
import Client from '../../clients/types/clients';
import { AssetService } from '../../assets/services/asset.service';
import { Asset } from '../../assets/types/asset.type';
import { UserService } from '../../users/services/user.service';
import User from '../../users/types/user';
import { DocumentDetailComponent } from '../components/document-detail.component';
import {
  CreateDocumentDTO,
  DOCUMENT_STATUS_LABELS,
  DocumentStatus,
  DocumentType,
  FilterDocumentParams,
  OSDocument,
} from '../types/documents.types';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, FormsModule, PaginatorComponent, DocumentDetailComponent],
  templateUrl: './document.html',
})
export class Documents {
  private notification = inject(NotificationService);
  private documentService = inject(DocumentService);
  private clientService = inject(ClientService);
  private assetService = inject(AssetService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  statusLabels = DOCUMENT_STATUS_LABELS;

  // --- Listagem ---
  listDocuments: OSDocument[] = [];
  page = 1;
  limit = 20;
  totalPages = 0;
  totalItems = 0;

  // --- Filtros ---
  filterStatus: DocumentStatus | '' = '';
  filterType: DocumentType | '' = '';

  filterClientTerm = '';
  filterClientResults: Client[] = [];
  filterClient: Client | null = null;
  private filterClientTimer: ReturnType<typeof setTimeout> | null = null;

  filterAssetTerm = '';
  filterAssetResults: Asset[] = [];
  filterAsset: Asset | null = null;
  private filterAssetTimer: ReturnType<typeof setTimeout> | null = null;

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  filterStartDate: string = this.today();
  filterEndDate: string = this.today();

  mechanics: User[] = [];
  filterMechanicId: number | null = null;

  filterMinTotal: number | null = null;
  filterMaxTotal: number | null = null;

  // --- Criação ---
  showCreateForm = false;
  newDocumentType: DocumentType = 'QUOTE';
  creating = false;

  newClientTerm = '';
  newClientResults: Client[] = [];
  newClientSelected: Client | null = null;
  private newClientTimer: ReturnType<typeof setTimeout> | null = null;

  newAssetOptions: Asset[] = [];
  newAssetSelected: Asset | null = null;

  // --- Detalhe ---
  selectedDocument: OSDocument | null = null;

  ngOnInit() {
    this.loadDocuments();
    this.loadMechanics();
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  private loadMechanics() {
    this.userService.getUsers({ role: 'MECHANIC' }).subscribe({
      next: (users) => {
        this.mechanics = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mechanics = [];
      },
    });
  }

  // --- Listagem ---
  loadDocuments() {
    const filters: FilterDocumentParams = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.filterType) filters.type = this.filterType;
    if (this.filterClient?.id) filters.clientId = this.filterClient.id;
    if (this.filterAsset?.id) filters.assetId = this.filterAsset.id;
    if (this.filterMechanicId) filters.mechanicId = this.filterMechanicId;
    if (this.filterStartDate) filters.startDate = this.filterStartDate;
    if (this.filterEndDate) filters.endDate = this.filterEndDate;
    if (this.filterMinTotal !== null) filters.minTotal = this.filterMinTotal;
    if (this.filterMaxTotal !== null) filters.maxTotal = this.filterMaxTotal;

    this.documentService.getAll(this.page, this.limit, filters).subscribe({
      next: (response) => {
        this.listDocuments = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar documentos: ${e.error?.message || e.message}`);
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadDocuments();
  }

  // --- Filtro por cliente ---
  onFilterClientTermChange() {
    this.filterClient = null;

    if (this.filterClientTimer) clearTimeout(this.filterClientTimer);

    const term = this.filterClientTerm.trim();
    if (!term) {
      this.filterClientResults = [];
      this.onFilterChange();
      return;
    }

    this.filterClientTimer = setTimeout(() => {
      this.clientService.findClientByName(term).subscribe({
        next: (clients) => {
          this.filterClientResults = clients;
          this.cdr.detectChanges();
        },
        error: () => {
          this.filterClientResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectFilterClient(client: Client) {
    this.filterClient = client;
    this.filterClientTerm = client.name;
    this.filterClientResults = [];
    this.onFilterChange();
  }

  clearFilterClient() {
    this.filterClient = null;
    this.filterClientTerm = '';
    this.filterClientResults = [];
    this.onFilterChange();
  }

  // --- Filtro por veículo ---
  onFilterAssetTermChange() {
    this.filterAsset = null;

    if (this.filterAssetTimer) clearTimeout(this.filterAssetTimer);

    const term = this.filterAssetTerm.trim();
    if (!term) {
      this.filterAssetResults = [];
      this.onFilterChange();
      return;
    }

    this.filterAssetTimer = setTimeout(() => {
      this.assetService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.filterAssetResults = response.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.filterAssetResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectFilterAsset(asset: Asset) {
    this.filterAsset = asset;
    this.filterAssetTerm = asset.label;
    this.filterAssetResults = [];
    this.onFilterChange();
  }

  clearFilterAsset() {
    this.filterAsset = null;
    this.filterAssetTerm = '';
    this.filterAssetResults = [];
    this.onFilterChange();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadDocuments();
  }

  // --- Criação ---
  openCreateForm() {
    this.showCreateForm = true;
  }

  closeCreateForm() {
    this.showCreateForm = false;
    this.resetCreateForm();
  }

  private resetCreateForm() {
    this.newDocumentType = 'QUOTE';
    this.newClientTerm = '';
    this.newClientResults = [];
    this.newClientSelected = null;
    this.newAssetOptions = [];
    this.newAssetSelected = null;
  }

  onNewClientTermChange() {
    this.newClientSelected = null;
    this.newAssetOptions = [];
    this.newAssetSelected = null;

    if (this.newClientTimer) clearTimeout(this.newClientTimer);

    const term = this.newClientTerm.trim();
    if (!term) {
      this.newClientResults = [];
      return;
    }

    this.newClientTimer = setTimeout(() => {
      this.clientService.findClientByName(term).subscribe({
        next: (clients) => {
          this.newClientResults = clients;
          this.cdr.detectChanges();
        },
        error: () => {
          this.newClientResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectNewClient(client: Client) {
    this.newClientSelected = client;
    this.newClientTerm = client.name;
    this.newClientResults = [];

    this.assetService.getAll(1, 50, { clientId: client.id! }).subscribe({
      next: (response) => {
        this.newAssetOptions = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.newAssetOptions = [];
      },
    });
  }

  createDocument() {
    if (!this.newClientSelected) {
      this.notification.error('Selecione o cliente.');
      return;
    }

    const dto: CreateDocumentDTO = {
      type: this.newDocumentType,
      clientId: this.newClientSelected.id!,
      assetId: this.newAssetSelected?.id,
    };

    this.creating = true;

    this.documentService.create(dto).subscribe({
      next: (document) => {
        this.notification.success('Documento criado com sucesso!');
        this.creating = false;
        this.closeCreateForm();
        this.page = 1;
        this.loadDocuments();
        this.openDocument(document);
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao criar documento: ${e.error?.message || e.message}`);
      },
    });
  }

  // --- Detalhe ---
  openDocument(document: OSDocument) {
    this.selectedDocument = document;
  }

  closeDocument() {
    this.selectedDocument = null;
  }

  onDocumentChanged(document: OSDocument) {
    this.selectedDocument = document;
    this.loadDocuments();
  }
}
