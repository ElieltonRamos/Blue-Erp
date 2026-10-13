// components/product-material-select-modal/product-material-select-modal.ts
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ProductService } from '../../../products/services/product.service';
import { Product, CreateProductDTO } from '../../../products/types/product';
import {
  CreatePrimaryMaterialDTO,
  PrimaryMaterial,
} from '../../../products/types/primary-material';
import { PrimaryMaterialService } from '../../../products/services/primary-material.service';

export type ProductMaterialSelection =
  | { kind: 'product'; id: number; name: string }
  | { kind: 'material'; id: number; name: string };

@Component({
  selector: 'app-product-material-select-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-material-select-modal.html',
})
export class ProductMaterialSelectModal implements OnChanges {
  @Input() show = false;
  @Input() itemDescription = '';
  @Input() itemNcm = '';
  @Input() itemUnitCost = 0;
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<ProductMaterialSelection>();

  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private materialService = inject(PrimaryMaterialService);
  private cdr = inject(ChangeDetectorRef);

  tab: 'product' | 'material' = 'product';

  searchTerm = '';
  productResults: Product[] = [];
  materialResults: PrimaryMaterial[] = [];
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  showCreateForm = false;

  newProduct: CreateProductDTO = this.blankProduct();
  newMaterial: CreatePrimaryMaterialDTO = this.blankMaterial();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['show'] && this.show) {
      this.tab = 'product';
      this.reset();
    }
  }

  private blankProduct(): CreateProductDTO {
    return {
      name: this.itemDescription || '',
      code: '',
      price: 0,
      costPrice: this.itemUnitCost || 0,
      extraCosts: 0,
      ncm: /^\d{8}$/.test(this.itemNcm) ? this.itemNcm : '',
      origin: 0,
      unit: 'UN',
      productType: 'RESALE',
    };
  }

  private blankMaterial(): CreatePrimaryMaterialDTO {
    return {
      name: this.itemDescription || '',
      code: '',
      unit: 'UN',
      unitCost: this.itemUnitCost || 0,
    };
  }

  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const term = this.searchTerm.trim();
    if (!term) {
      this.productResults = [];
      this.materialResults = [];
      return;
    }
    this.searchTimer = setTimeout(() => {
      if (this.tab === 'product') {
        this.productService.getAll(1, 10, { search: term }).subscribe({
          next: (res) => {
            this.productResults = res.data;
            this.cdr.detectChanges();
          },
        });
      } else {
        this.materialService.getAll(1, 10, { search: term }).subscribe({
          next: (res) => {
            this.materialResults = res.data;
            this.cdr.detectChanges();
          },
        });
      }
    }, 350);
  }

  switchTab(tab: 'product' | 'material') {
    this.tab = tab;
    this.searchTerm = '';
    this.productResults = [];
    this.materialResults = [];
    this.showCreateForm = false;
  }

  selectProduct(p: Product) {
    this.selected.emit({ kind: 'product', id: p.id, name: p.name });
    this.reset();
  }

  selectMaterial(m: PrimaryMaterial) {
    this.selected.emit({ kind: 'material', id: m.id, name: m.name });
    this.reset();
  }

  openCreateForm() {
    this.showCreateForm = true;

    if (this.tab === 'product') {
      this.newProduct = this.blankProduct();
      this.productService.getSuggestCode().subscribe({
        next: (res) => (this.newProduct.code = res.code),
      });
    } else {
      this.newMaterial = this.blankMaterial();
      this.materialService.getSuggestedCode().subscribe({
        next: (res) => (this.newMaterial.code = res.code.toString()),
      });
    }
  }

  createProduct() {
    if (!this.newProduct.name?.trim() || !this.newProduct.code?.trim()) {
      this.notification.error('Informe nome e código do produto');
      return;
    }
    if (!/^\d{8}$/.test(this.newProduct.ncm)) {
      this.notification.error('NCM deve ter 8 dígitos');
      return;
    }

    this.productService.create(this.newProduct).subscribe({
      next: (created) => {
        this.notification.success('Produto cadastrado com sucesso');
        this.selected.emit({ kind: 'product', id: created.id, name: created.name });
        this.reset();
      },
      error: (e) => {
        this.notification.error(`Erro ao cadastrar produto: ${e.error?.message || e.message}`);
      },
    });
  }

  createMaterial() {
    if (!this.newMaterial.name?.trim() || !this.newMaterial.code?.trim()) {
      this.notification.error('Informe nome e código da matéria-prima');
      return;
    }

    this.materialService.create(this.newMaterial).subscribe({
      next: (created) => {
        this.notification.success('Matéria-prima cadastrada com sucesso');
        this.selected.emit({ kind: 'material', id: created.id, name: created.name });
        this.reset();
      },
      error: (e) => {
        this.notification.error(
          `Erro ao cadastrar matéria-prima: ${e.error?.message || e.message}`,
        );
      },
    });
  }

  closeModal() {
    this.reset();
    this.close.emit();
  }

  private reset() {
    this.searchTerm = '';
    this.productResults = [];
    this.materialResults = [];
    this.showCreateForm = false;
  }
}
