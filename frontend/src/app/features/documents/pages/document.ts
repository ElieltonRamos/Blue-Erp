import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaginatorComponent } from '../../../shared/paginator/paginator.component';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';
import { DocumentService } from '../services/document.service';
import {
  OSDocument,
  DocumentType,
  DocumentStatus,
  DocumentItemType,
  CreateDocumentDTO,
  AddDocumentItemDTO,
  FilterDocumentParams,
} from '../types/documents.types';
import { ClientService } from '../../clients/services/client.service';
import Client from '../../clients/types/clients';
import { AssetService } from '../../assets/services/asset.service';
import { Asset } from '../../assets/types/asset.type';
import { ProductService } from '../../products/services/product.service';
import { Product } from '../../products/types/product';
import { UserService } from '../../users/services/user.service';
import User from '../../users/types/user';
import { CatalogService } from '../../catalog-services/services/catalog.service';
import { Service } from '../../catalog-services/types/catalog-types';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, FormsModule, PaginatorComponent],
  templateUrl: './document.html',
})
export class Documents {
  private notification = inject(NotificationService);
  private documentService = inject(DocumentService);
  private clientService = inject(ClientService);
  private assetService = inject(AssetService);
  private productService = inject(ProductService);
  private catalogService = inject(CatalogService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // --- Listagem ---
  listDocuments: OSDocument[] = [];
  page = 1;
  limit = 20;
  totalPages = 0;
  totalItems = 0;

  filterStatus: DocumentStatus | '' = '';
  filterType: DocumentType | '' = '';
  filterClientTerm = '';
  filterClientResults: Client[] = [];
  filterClient: Client | null = null;
  private filterClientTimer: ReturnType<typeof setTimeout> | null = null;

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

  // --- Detalhe / itens ---
  selectedDocument: OSDocument | null = null;

  itemType: DocumentItemType = 'PRODUCT';
  itemQuantity = 1;
  itemUnitPrice = 0;
  addingItem = false;

  productTerm = '';
  productResults: Product[] = [];
  productSelected: Product | null = null;
  private productTimer: ReturnType<typeof setTimeout> | null = null;

  serviceTerm = '';
  serviceResults: Service[] = [];
  serviceSelected: Service | null = null;
  private serviceTimer: ReturnType<typeof setTimeout> | null = null;

  mechanics: User[] = [];
  mechanicId: number | null = null;

  ngOnInit() {
    this.loadDocuments();
    this.loadMechanics();
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  // --- Listagem ---
  loadDocuments() {
    const filters: FilterDocumentParams = {};
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.filterType) filters.type = this.filterType;
    if (this.filterClient?.id) filters.clientId = this.filterClient.id;

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
    this.resetItemForm();
  }

  closeDocument() {
    this.selectedDocument = null;
  }

  private resetItemForm() {
    this.itemType = 'PRODUCT';
    this.itemQuantity = 1;
    this.itemUnitPrice = 0;
    this.productTerm = '';
    this.productResults = [];
    this.productSelected = null;
    this.serviceTerm = '';
    this.serviceResults = [];
    this.serviceSelected = null;
    this.mechanicId = null;
  }

  loadMechanics() {
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

  onProductTermChange() {
    this.productSelected = null;

    if (this.productTimer) clearTimeout(this.productTimer);

    const term = this.productTerm.trim();
    if (!term) {
      this.productResults = [];
      return;
    }

    this.productTimer = setTimeout(() => {
      this.productService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.productResults = response.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.productResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectProduct(product: Product) {
    this.productSelected = product;
    this.productTerm = product.name;
    this.productResults = [];
    this.itemUnitPrice = Number(product.price);
  }

  onServiceTermChange() {
    this.serviceSelected = null;

    if (this.serviceTimer) clearTimeout(this.serviceTimer);

    const term = this.serviceTerm.trim();
    if (!term) {
      this.serviceResults = [];
      return;
    }

    this.serviceTimer = setTimeout(() => {
      this.catalogService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.serviceResults = response.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.serviceResults = [];
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectService(service: Service) {
    this.serviceSelected = service;
    this.serviceTerm = service.name;
    this.serviceResults = [];
    this.itemUnitPrice = Number(service.price);
  }

  addItem() {
    if (!this.selectedDocument) return;

    if (this.itemType === 'PRODUCT' && !this.productSelected) {
      this.notification.error('Selecione o produto/peça.');
      return;
    }
    if (this.itemType === 'SERVICE' && !this.serviceSelected) {
      this.notification.error('Selecione o serviço.');
      return;
    }
    if (!this.itemQuantity || this.itemQuantity <= 0) {
      this.notification.error('Informe uma quantidade válida.');
      return;
    }
    if (this.itemUnitPrice < 0) {
      this.notification.error('Informe um preço válido.');
      return;
    }

    const dto: AddDocumentItemDTO = {
      type: this.itemType,
      productId: this.itemType === 'PRODUCT' ? (this.productSelected!.id as number) : undefined,
      serviceId: this.itemType === 'SERVICE' ? (this.serviceSelected!.id as number) : undefined,
      mechanicId: this.itemType === 'SERVICE' ? (this.mechanicId ?? undefined) : undefined,
      quantity: this.itemQuantity,
      unitPrice: this.itemUnitPrice,
    };

    this.addingItem = true;

    this.documentService.addItem(this.selectedDocument.id, dto).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.addingItem = false;
        this.resetItemForm();
        this.notification.success('Item adicionado com sucesso!');
        this.loadDocuments();
      },
      error: (e) => {
        this.addingItem = false;
        this.notification.error(`Erro ao adicionar item: ${e.error?.message || e.message}`);
      },
    });
  }

  removeItem(itemId: number) {
    if (!this.selectedDocument) return;

    this.documentService.removeItem(this.selectedDocument.id, itemId).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.notification.success('Item removido.');
        this.loadDocuments();
      },
      error: (e) => {
        this.notification.error(`Erro ao remover item: ${e.error?.message || e.message}`);
      },
    });
  }

  // --- Ações de status ---
  approve() {
    if (!this.selectedDocument) return;

    this.documentService.approve(this.selectedDocument.id).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.notification.success('Orçamento aprovado.');
        this.loadDocuments();
      },
      error: (e) => {
        this.notification.error(`Erro ao aprovar: ${e.error?.message || e.message}`);
      },
    });
  }

  advanceToInProgress() {
    if (!this.selectedDocument) return;

    this.documentService
      .updateStatus(this.selectedDocument.id, { status: 'IN_PROGRESS' })
      .subscribe({
        next: (document) => {
          this.selectedDocument = document;
          this.notification.success('OS em andamento.');
          this.loadDocuments();
        },
        error: (e) => {
          this.notification.error(`Erro ao atualizar status: ${e.error?.message || e.message}`);
        },
      });
  }

  async cancel() {
    if (!this.selectedDocument) return;

    const confirmed = await alertConfirm('Tem certeza que deseja cancelar este orçamento/OS?');
    if (!confirmed) return;

    this.documentService.cancel(this.selectedDocument.id).subscribe({
      next: (document) => {
        this.selectedDocument = document;
        this.notification.success('Documento cancelado.');
        this.loadDocuments();
      },
      error: (e) => {
        this.notification.error(`Erro ao cancelar: ${e.error?.message || e.message}`);
      },
    });
  }

  canAddItem(): boolean {
    return (
      !!this.selectedDocument && !['COMPLETED', 'CANCELED'].includes(this.selectedDocument.status)
    );
  }

  canApprove(): boolean {
    return this.selectedDocument?.status === 'DRAFT';
  }

  canAdvance(): boolean {
    return this.selectedDocument?.status === 'APPROVED';
  }

  canCancel(): boolean {
    return (
      !!this.selectedDocument && !['COMPLETED', 'CANCELED'].includes(this.selectedDocument.status)
    );
  }
}
