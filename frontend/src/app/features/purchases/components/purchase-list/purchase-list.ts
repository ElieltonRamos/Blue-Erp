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
} from '../../types/purchase';
import { Product } from '../../../products/types/product';
import { PrimaryMaterialService } from '../../../products/services/primary-material.service';
import { PrimaryMaterial } from '../../../products/types/primary-material';

@Component({
  selector: 'app-purchase-list',
  imports: [CommonModule, FormsModule, PaginatorComponent],
  templateUrl: './purchase-list.html',
})
export class PurchaseList {
  private notification = inject(NotificationService);
  private purchaseService = inject(PurchaseService);
  private productService = inject(ProductService);
  private materialService = inject(PrimaryMaterialService);
  private cdr = inject(ChangeDetectorRef);

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

  page = 1;
  limit = 20;
  totalPages = 0;
  totalItems = 0;

  filter: PurchaseFilters = { status: '', supplier: '' };

  ngOnInit() {
    this.loadPurchases();
  }

  // --- Import ---
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

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
    this.filter = { status: '', supplier: '' };
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
