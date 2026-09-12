import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AddDocumentItemDTO,
  DOCUMENT_STATUS_LABELS,
  DocumentItemType,
  OSDocument,
  UpdateDocumentItemDTO,
} from '../types/documents.types';
import { NotificationService } from '../../../shared/toastr/notification.service';
import { DocumentService } from '../services/document.service';
import { ProductService } from '../../products/services/product.service';
import { CatalogService } from '../../catalog-services/services/catalog.service';
import { UserService } from '../../users/services/user.service';
import { Product } from '../../products/types/product';
import { Service } from '../../catalog-services/types/catalog-types';
import User from '../../users/types/user';
import { alertConfirm } from '../../../shared/alerts/custom-alerts';

@Component({
  selector: 'app-document-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './document-detail.component.html',
})
export class DocumentDetailComponent {
  @Input({ required: true }) document!: OSDocument;
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

  mechanics: User[] = [];
  mechanicId: number | null = null;

  // --- Edição de item ---
  editingItemId: number | null = null;
  editQuantity = 0;
  editUnitPrice = 0;
  savingEdit = false;

  ngOnInit() {
    this.loadMechanics();
  }

  close() {
    this.closed.emit();
  }

  private loadMechanics() {
    this.userService.getUsers({ role: 'MECHANIC' }).subscribe({
      next: (users) => {
        console.log(users, 'usuarios mecanicos')
        this.mechanics = users;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mechanics = [];
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
    this.mechanicId = null;
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
      mechanicId: this.itemType === 'SERVICE' ? (this.mechanicId ?? undefined) : undefined,
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
    this.editQuantity = item.quantity;
    this.editUnitPrice = item.unitPrice;
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

  print() {
    const rows = this.document.items
      .map(
        (item) => `
      <tr>
        <td>${item.type === 'PRODUCT' ? item.productName : item.serviceName}</td>
        <td>${item.quantity}</td>
        <td>R$ ${Number(item.unitPrice).toFixed(2)}</td>
        <td>R$ ${Number(item.total).toFixed(2)}</td>
      </tr>`,
      )
      .join('');

    const html = `
    <html>
      <head>
        <title>Documento #${this.document.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #000; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; font-size: 13px; }
          th { background: #eee; }
          .total { text-align: right; font-weight: bold; margin-top: 12px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>${this.document.type === 'QUOTE' ? 'Orçamento' : 'Ordem de Serviço'} #${this.document.id}</h1>
        <p>Cliente: ${this.document.clientName}</p>
        <p>Status: ${this.statusLabels[this.document.status]}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Total: R$ ${Number(this.document.total).toFixed(2)}</p>
      </body>
    </html>
  `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.notification.error('Não foi possível abrir a janela de impressão.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
