import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AddDocumentItemDTO,
  DOCUMENT_STATUS_LABELS,
  DocumentItemType,
  OSDocument,
  UpdateDocumentItemDTO,
} from '../../types/documents.types';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { DocumentService } from '../../services/document.service';
import { ProductService } from '../../../products/services/product.service';
import { CatalogService } from '../../../catalog-services/services/catalog.service';
import { UserService } from '../../../users/services/user.service';
import { Product } from '../../../products/types/product';
import { Service } from '../../../catalog-services/types/catalog-types';
import User from '../../../users/types/user';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { ModalDocumentNote } from '../modal-document/modal-document-note';
import { Router } from '@angular/router';
import { SaleService } from '../../../sales/services/sales.service';
import { Sale } from '../../../sales/types/sale';
import { ModalSalesNote } from '../../../sales/components/modal-sales-note/modal-sales-note';

@Component({
  selector: 'app-document-detail',
  imports: [CommonModule, FormsModule, ModalDocumentNote, ModalSalesNote],
  templateUrl: './document-detail.component.html',
})
export class DocumentDetailComponent {
  private router = inject(Router);
  @Input({ required: true }) document!: OSDocument;
  @Input() allUsers: User[] = [];
  @Input() users: User[] = [];

  private saleService = inject(SaleService);

  showSalePrintModal = false;
  saleData: Sale | null = null;
  loadingSale = false;
  editingResponsible = false;
  editResponsibleId: number | null = null;
  savingResponsible = false;
  showPrintModal = false;

  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<OSDocument>();

  private notification = inject(NotificationService);
  private documentService = inject(DocumentService);
  private productService = inject(ProductService);
  private catalogService = inject(CatalogService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  statusLabels = DOCUMENT_STATUS_LABELS;

  // --- Adicionar item ---
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

  userId: number | null = null;
  edituserId: number | null = null;

  // --- Edição de item ---
  editingItemId: number | null = null;
  editQuantity = 0;
  editUnitPrice = 0;
  savingEdit = false;

  ngOnInit() {
    this.loadusers();
  }

  close() {
    this.closed.emit();
  }

  openPrintModal() {
    this.showPrintModal = true;
  }

  closePrintModal() {
    this.showPrintModal = false;
  }

  canPrintSale(): boolean {
    return this.document.status === 'COMPLETED';
  }

  openSalePrintModal(): void {
    this.loadingSale = true;
    this.saleService.getSaleByDocumentId(this.document.id).subscribe({
      next: (sale) => {
        this.saleData = sale;
        this.showSalePrintModal = true;
        this.loadingSale = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar venda: ${e.error?.message || e.message}`);
        this.loadingSale = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeSalePrintModal(): void {
    this.showSalePrintModal = false;
    this.saleData = null;
  }

  finalizeToSale(): void {
    this.router.navigate(['/ordem-servico', this.document.id, 'finalizar']);
  }

  canFinalize(): boolean {
    return this.document.status === 'IN_PROGRESS';
  }

  private loadusers() {
    this.userService.getUsers({ role: 'mechanic' }).subscribe({
      next: (users) => {
        console.log(users, 'usuarios mecanicos');
        this.users = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.users = [];
      },
    });
  }

  startEditResponsible() {
    this.editingResponsible = true;
    this.editResponsibleId = this.document.responsibleId;
  }

  cancelEditResponsible() {
    this.editingResponsible = false;
  }

  saveResponsible() {
    if (!this.editResponsibleId) {
      this.notification.error('Selecione um responsável.');
      return;
    }

    this.savingResponsible = true;

    this.documentService
      .updateResponsible(this.document.id, { responsibleId: this.editResponsibleId })
      .subscribe({
        next: (document) => {
          this.document = document;
          this.savingResponsible = false;
          this.editingResponsible = false;
          this.notification.success('Responsável atualizado.');
          this.changed.emit(document);
        },
        error: (e) => {
          this.savingResponsible = false;
          this.notification.error(
            `Erro ao atualizar responsável: ${e.error?.message || e.message}`,
          );
        },
      });
  }

  // --- Busca produto ---
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

  // --- Busca serviço ---
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
    this.userId = null;
  }

  addItem() {
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
      userId: this.itemType === 'SERVICE' ? (this.userId ?? undefined) : undefined,
      quantity: this.itemQuantity,
      unitPrice: this.itemUnitPrice,
    };

    this.addingItem = true;

    this.documentService.addItem(this.document.id, dto).subscribe({
      next: (document) => {
        this.document = document;
        this.addingItem = false;
        this.resetItemForm();
        this.notification.success('Item adicionado com sucesso!');
        this.changed.emit(document);
      },
      error: (e) => {
        this.addingItem = false;
        this.notification.error(`Erro ao adicionar item: ${e.error?.message || e.message}`);
      },
    });
  }

  removeItem(itemId: number) {
    this.documentService.removeItem(this.document.id, itemId).subscribe({
      next: (document) => {
        this.document = document;
        this.notification.success('Item removido.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.notification.error(`Erro ao remover item: ${e.error?.message || e.message}`);
      },
    });
  }

  // --- Editar item ---
  startEditItem(item: OSDocument['items'][number]) {
    this.editingItemId = item.id;
    this.editQuantity = Number(item.quantity);
    this.editUnitPrice = Number(item.unitPrice);
    this.edituserId = item.userId;
  }

  cancelEditItem() {
    this.editingItemId = null;
  }

  saveEditItem(itemId: number) {
    if (!this.editQuantity || this.editQuantity <= 0) {
      this.notification.error('Informe uma quantidade válida.');
      return;
    }
    if (this.editUnitPrice < 0) {
      this.notification.error('Informe um preço válido.');
      return;
    }

    const dto: UpdateDocumentItemDTO = {
      quantity: this.editQuantity,
      unitPrice: this.editUnitPrice,
      userId: this.edituserId ?? undefined,
    };

    this.savingEdit = true;

    this.documentService.updateItem(this.document.id, itemId, dto).subscribe({
      next: (document) => {
        this.document = document;
        this.savingEdit = false;
        this.editingItemId = null;
        this.notification.success('Item atualizado.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.savingEdit = false;
        this.notification.error(`Erro ao atualizar item: ${e.error?.message || e.message}`);
      },
    });
  }

  // --- Ações de status ---
  approve() {
    this.documentService.approve(this.document.id).subscribe({
      next: (document) => {
        this.document = document;
        this.notification.success('Orçamento aprovado.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.notification.error(`Erro ao aprovar: ${e.error?.message || e.message}`);
      },
    });
  }

  advanceToInProgress() {
    this.documentService.updateStatus(this.document.id, { status: 'IN_PROGRESS' }).subscribe({
      next: (document) => {
        this.document = document;
        this.notification.success('OS em andamento.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar status: ${e.error?.message || e.message}`);
      },
    });
  }

  async cancel() {
    const confirmed = await alertConfirm('Tem certeza que deseja cancelar este orçamento/OS?');
    if (!confirmed) return;

    this.documentService.cancel(this.document.id).subscribe({
      next: (document) => {
        this.document = document;
        this.notification.success('Documento cancelado.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.notification.error(`Erro ao cancelar: ${e.error?.message || e.message}`);
      },
    });
  }

  canAddItem(): boolean {
    return !['COMPLETED', 'CANCELED'].includes(this.document.status);
  }

  canApprove(): boolean {
    return this.document.status === 'DRAFT';
  }

  canAdvance(): boolean {
    return this.document.status === 'APPROVED';
  }

  canCancel(): boolean {
    return !['COMPLETED', 'CANCELED'].includes(this.document.status);
  }

  canReopen(): boolean {
    return this.document.status === 'CANCELED';
  }

  reopen() {
    this.documentService.reopen(this.document.id).subscribe({
      next: (document) => {
        this.document = document;
        this.notification.success('Documento reaberto.');
        this.changed.emit(document);
      },
      error: (e) => {
        this.notification.error(`Erro ao reabrir: ${e.error?.message || e.message}`);
      },
    });
  }
}
