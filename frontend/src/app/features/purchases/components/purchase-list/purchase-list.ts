// purchase-list.ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { PurchaseService } from '../../services/purchase.service';
import { ProductService } from '../../../products/services/product.service';
import {
  Purchase,
  PurchaseFilters,
  ParsedPurchasePreview,
  ReconciledPurchaseItem,
  CreatePurchaseFromXml,
  BusinessPartner,
  ManualInstallment,
  ManualPurchaseItem,
  CreateManualPurchase,
} from '../../types/purchase';
import { Product } from '../../../products/types/product';
import { PrimaryMaterialService } from '../../../products/services/primary-material.service';
import { PrimaryMaterial } from '../../../products/types/primary-material';
import {
  ProductMaterialSelection,
  ProductMaterialSelectModal,
} from '../product-material-select-modal/product-material-select-modal';
import { BusinessPartnerService } from '../../services/business-partner.service';

@Component({
  selector: 'app-purchase-list',
  imports: [CommonModule, FormsModule, PaginatorComponent, ProductMaterialSelectModal],
  templateUrl: './purchase-list.html',
})
export class PurchaseList {
  private notification = inject(NotificationService);
  private purchaseService = inject(PurchaseService);
  private productService = inject(ProductService);
  private materialService = inject(PrimaryMaterialService);
  private cdr = inject(ChangeDetectorRef);
  private partnerService = inject(BusinessPartnerService);

  // --- Import + Conciliação ---
  selectedFile: File | null = null;
  loadingParse = false;
  preview: ParsedPurchasePreview | null = null;
  reconciledItems: ReconciledPurchaseItem[] = [];

  productTerm: Record<number, string> = {};
  productResults: Record<number, Product[]> = {};
  materialTerm: Record<number, string> = {};
  materialResults: Record<number, PrimaryMaterial[]> = {};
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Listagem ---
  listPurchases: Purchase[] = [];
  expandedPurchases = new Set<number>();
  selectModalOpen = false;
  selectModalIndex: number | null = null;
  createMode: 'xml' | 'manual' = 'xml';

  // --- Lançamento manual ---
  manualSupplierTerm = '';
  manualSupplierResults: BusinessPartner[] = [];
  manualSupplierSelected: BusinessPartner | null = null;
  private manualSupplierTimer: ReturnType<typeof setTimeout> | null = null;

  manualInvoiceNumber = '';
  manualItems: ManualPurchaseItem[] = [];
  manualInstallments: ManualInstallment[] = [];

  manualSelectModalOpen = false;
  manualSelectModalIndex: number | null = null;

  // --- Cadastro rápido de fornecedor ---
  quickCreateSupplierOpen = false;
  quickCreateSupplierName = '';
  quickCreateSupplierDocument = '';
  quickCreateSupplierLoading = false;

  page = 1;
  limit = 20;
  totalPages = 0;
  totalItems = 0;

  filter: PurchaseFilters = {
    status: '',
    supplier: '',
    invoiceNumber: '',
    fiscalKey: '',
    startDate: '',
    endDate: '',
  };

  ngOnInit() {
    this.loadPurchases();
  }

  // --- Import ---
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }
  openSelectModal(index: number) {
    this.selectModalIndex = index;
    this.selectModalOpen = true;
  }

  onItemSelected(selection: ProductMaterialSelection) {
    if (this.selectModalIndex === null) return;
    const item = this.reconciledItems[this.selectModalIndex];
    if (selection.kind === 'product') {
      item.productId = selection.id;
      item.materialId = undefined;
    } else {
      item.materialId = selection.id;
      item.productId = undefined;
    }
    this.linkedNames[this.selectModalIndex] = selection.name;
    this.selectModalOpen = false;
    this.selectModalIndex = null;
  }

  linkedNames: Record<number, string> = {};

  parseXml() {
    if (!this.selectedFile) {
      this.notification.error('Selecione um arquivo XML');
      return;
    }

    this.loadingParse = true;
    this.purchaseService.parseXml(this.selectedFile).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.reconciledItems = preview.items.map((i) => ({ ...i }));
        this.loadingParse = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao processar XML: ${e.error?.message || e.message}`);
        this.loadingParse = false;
      },
    });
  }

  // --- Conciliação ---
  onProductTermChange(index: number) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const term = this.productTerm[index]?.trim();
    if (!term) {
      this.productResults[index] = [];
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.productService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.productResults[index] = response.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.productResults[index] = [];
        },
      });
    }, 350);
  }

  selectProduct(index: number, product: Product) {
    this.reconciledItems[index].productId = product.id;
    this.reconciledItems[index].materialId = undefined;
    this.productTerm[index] = product.name;
    this.productResults[index] = [];
  }

  onMaterialTermChange(index: number) {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const term = this.materialTerm[index]?.trim();
    if (!term) {
      this.materialResults[index] = [];
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.materialService.getAll(1, 10, { search: term }).subscribe({
        next: (response) => {
          this.materialResults[index] = response.data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.materialResults[index] = [];
        },
      });
    }, 350);
  }

  selectMaterial(index: number, material: PrimaryMaterial) {
    this.reconciledItems[index].materialId = material.id;
    this.reconciledItems[index].productId = undefined;
    this.materialTerm[index] = material.name;
    this.materialResults[index] = [];
  }

  clearItemLink(index: number) {
    this.reconciledItems[index].productId = undefined;
    this.reconciledItems[index].materialId = undefined;
    this.productTerm[index] = '';
    this.materialTerm[index] = '';
  }

  isItemLinked(index: number): boolean {
    return !!this.reconciledItems[index].productId || !!this.reconciledItems[index].materialId;
  }

  confirmPurchase() {
    if (!this.preview) return;

    const unlinkedCount = this.reconciledItems.filter(
      (item) => !item.productId && !item.materialId,
    ).length;

    if (unlinkedCount > 0) {
      alertConfirm(
        `${unlinkedCount} item(ns) sem vínculo — serão registrados como consumo, sem baixa de estoque. Confirmar mesmo assim?`,
      ).then((result) => {
        if (result) {
          this.sendPurchase();
        }
      });
      return;
    }

    this.sendPurchase();
  }

  private sendPurchase() {
    if (!this.preview) return;

    const dto: CreatePurchaseFromXml = {
      supplierCnpj: this.preview.supplierCnpj,
      supplierName: this.preview.supplierName,
      destCnpj: this.preview.destCnpj,
      invoiceNumber: this.preview.invoiceNumber,
      fiscalKey: this.preview.fiscalKey,
      fiscalXml: this.preview.fiscalXml,
      items: this.reconciledItems,
      installments: this.preview.installments,
    };

    console.log('DTO enviado:', JSON.stringify(dto.items, null, 2));

    this.purchaseService.createPurchase(dto).subscribe({
      next: () => {
        this.notification.success('Compra registrada com sucesso');
        this.resetImport();
        this.page = 1;
        this.loadPurchases();
      },
      error: (e) => {
        this.notification.error(`Erro ao registrar compra: ${e.error?.message || e.message}`);
      },
    });
  }

  cancelImport() {
    this.resetImport();
  }

  private resetImport() {
    this.selectedFile = null;
    this.preview = null;
    this.reconciledItems = [];
    this.productTerm = {};
    this.productResults = {};
    this.materialTerm = {};
    this.materialResults = {};
  }

  // --- Listagem ---
  applyFilters() {
    this.page = 1;
    this.loadPurchases();
  }

  clearFilters() {
    this.filter = {
      status: '',
      supplier: '',
      invoiceNumber: '',
      fiscalKey: '',
      startDate: '',
      endDate: '',
    };
    this.applyFilters();
  }

  loadPurchases() {
    this.purchaseService.getAllPurchases(this.page, this.limit, this.filter).subscribe({
      next: (response) => {
        this.listPurchases = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar compras: ${e.error?.message || e.message}`);
      },
    });
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadPurchases();
  }

  togglePurchase(id: number) {
    if (this.expandedPurchases.has(id)) {
      this.expandedPurchases.delete(id);
    } else {
      this.expandedPurchases.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedPurchases.has(id);
  }

  removePurchase(purchase: Purchase) {
    alertConfirm('Excluir esta compra definitivamente? Ação irreversível.').then((result) => {
      if (result) {
        this.purchaseService.removePurchase(purchase.id).subscribe({
          next: () => {
            this.notification.success('Compra excluída com sucesso');
            this.loadPurchases();
          },
          error: (e) => {
            this.notification.error(`Erro ao excluir compra: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  openQuickCreateSupplier() {
    this.quickCreateSupplierOpen = true;
    this.quickCreateSupplierName = this.manualSupplierTerm;
    this.quickCreateSupplierDocument = '';
  }

  cancelQuickCreateSupplier() {
    this.quickCreateSupplierOpen = false;
    this.quickCreateSupplierName = '';
    this.quickCreateSupplierDocument = '';
  }

  saveQuickCreateSupplier() {
    if (!this.quickCreateSupplierName.trim()) {
      this.notification.error('Informe o nome do fornecedor');
      return;
    }

    this.quickCreateSupplierLoading = true;
    this.partnerService
      .create({
        type: 'SUPPLIER',
        name: this.quickCreateSupplierName.trim(),
        document: this.quickCreateSupplierDocument.trim() || undefined,
      })
      .subscribe({
        next: (partner) => {
          this.notification.success('Fornecedor cadastrado com sucesso');
          this.selectManualSupplier(partner);
          this.quickCreateSupplierLoading = false;
          this.quickCreateSupplierOpen = false;
          this.quickCreateSupplierName = '';
          this.quickCreateSupplierDocument = '';
        },
        error: (e) => {
          this.notification.error(`Erro ao cadastrar fornecedor: ${e.error?.message || e.message}`);
          this.quickCreateSupplierLoading = false;
        },
      });
  }

  switchCreateMode(mode: 'xml' | 'manual') {
    this.createMode = mode;
  }

  onManualSupplierTermChange() {
    this.manualSupplierSelected = null;
    if (this.manualSupplierTimer) clearTimeout(this.manualSupplierTimer);
    const term = this.manualSupplierTerm.trim();
    if (!term) {
      this.manualSupplierResults = [];
      return;
    }
    this.manualSupplierTimer = setTimeout(() => {
      this.partnerService.getAll({ search: term }).subscribe({
        next: (partners) => {
          this.manualSupplierResults = partners;
          this.cdr.detectChanges();
        },
      });
    }, 350);
  }

  selectManualSupplier(partner: BusinessPartner) {
    this.manualSupplierSelected = partner;
    this.manualSupplierTerm = partner.name;
    this.manualSupplierResults = [];
  }

  addManualItem() {
    this.manualItems.push({
      description: '',
      quantity: 1,
      unitCost: 0,
      total: 0,
    });
  }

  removeManualItem(index: number) {
    this.manualItems.splice(index, 1);
  }

  recalcManualItemTotal(index: number) {
    const item = this.manualItems[index];
    item.total = Number((item.quantity * item.unitCost).toFixed(2));
  }

  openManualSelectModal(index: number) {
    this.manualSelectModalIndex = index;
    this.manualSelectModalOpen = true;
  }

  onManualItemSelected(selection: ProductMaterialSelection) {
    if (this.manualSelectModalIndex === null) return;
    const item = this.manualItems[this.manualSelectModalIndex];
    if (selection.kind === 'product') {
      item.productId = selection.id;
      item.materialId = undefined;
    } else {
      item.materialId = selection.id;
      item.productId = undefined;
    }
    if (!item.description) {
      item.description = selection.name;
    }
    this.manualSelectModalOpen = false;
    this.manualSelectModalIndex = null;
  }

  clearManualItemLink(index: number) {
    this.manualItems[index].productId = undefined;
    this.manualItems[index].materialId = undefined;
  }

  isManualItemLinked(index: number): boolean {
    const item = this.manualItems[index];
    return !!item.productId || !!item.materialId;
  }

  addManualInstallment() {
    this.manualInstallments.push({
      number: String(this.manualInstallments.length + 1).padStart(3, '0'),
      dueDate: '',
      value: 0,
    });
  }

  removeManualInstallment(index: number) {
    this.manualInstallments.splice(index, 1);
  }

  confirmManualPurchase() {
    if (!this.manualSupplierSelected) {
      this.notification.error('Selecione o fornecedor');
      return;
    }
    if (this.manualItems.length === 0) {
      this.notification.error('Adicione pelo menos um item');
      return;
    }
    for (const item of this.manualItems) {
      if (!item.description?.trim()) {
        this.notification.error('Todos os itens precisam de descrição');
        return;
      }
    }

    const unlinkedCount = this.manualItems.filter(
      (item) => !item.productId && !item.materialId,
    ).length;

    const send = () => this.sendManualPurchase();

    if (unlinkedCount > 0) {
      alertConfirm(
        `${unlinkedCount} item(ns) sem vínculo — serão registrados como consumo, sem baixa de estoque. Confirmar mesmo assim?`,
      ).then((result) => {
        if (result) send();
      });
      return;
    }

    send();
  }

  private sendManualPurchase() {
    if (!this.manualSupplierSelected) return;

    const dto: CreateManualPurchase = {
      supplierId: this.manualSupplierSelected.id,
      invoiceNumber: this.manualInvoiceNumber || undefined,
      items: this.manualItems,
      installments: this.manualInstallments,
    };

    this.purchaseService.createManualPurchase(dto).subscribe({
      next: () => {
        this.notification.success('Compra registrada com sucesso');
        this.resetManualForm();
        this.page = 1;
        this.loadPurchases();
      },
      error: (e) => {
        this.notification.error(`Erro ao registrar compra: ${e.error?.message || e.message}`);
      },
    });
  }

  private resetManualForm() {
    this.manualSupplierTerm = '';
    this.manualSupplierSelected = null;
    this.manualSupplierResults = [];
    this.manualInvoiceNumber = '';
    this.manualItems = [];
    this.manualInstallments = [];
  }

  cancelPurchase(purchase: Purchase) {
    alertConfirm('Cancelar esta compra? O estoque será estornado.').then((result) => {
      if (result) {
        this.purchaseService.cancelPurchase(purchase.id).subscribe({
          next: () => {
            this.notification.success('Compra cancelada e estoque estornado');
            this.loadPurchases();
          },
          error: (e) => {
            this.notification.error(`Erro ao cancelar compra: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }
}
