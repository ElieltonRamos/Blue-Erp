import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PrimaryMaterialService } from '../../services/primary-material.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { PrimaryMaterial } from '../../types/primary-material';
import { CompositionItem, Product, UpdateCompositionDTO } from '../../types/product';

type ItemType = 'material' | 'sub_product';

interface SubProductOption {
  id: number;
  name: string;
  code: string;
  costPrice: number;
  unit: string;
}

@Component({
  selector: 'app-modal-update-materials-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-update-materials-product.html',
})
export class ModalUpdateMaterialsProduct implements OnInit {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private primaryMaterialService = inject(PrimaryMaterialService);
  private cdr = inject(ChangeDetectorRef);

  @Input() product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  composition: CompositionItem[] = [];

  // Tipo de item sendo adicionado
  selectedItemType: ItemType = 'material';
  newQuantity: number = 0;

  // Busca matéria-prima
  searchTerm: string = '';
  searchResults: PrimaryMaterial[] = [];
  selectedMaterial: PrimaryMaterial | null = null;
  searchSubject = new Subject<string>();
  isSearching: boolean = false;

  // Busca subproduto
  subProductSearchTerm: string = '';
  subProductSearchResults: SubProductOption[] = [];
  selectedSubProduct: SubProductOption | null = null;
  subProductSearchSubject = new Subject<string>();
  isSearchingSubProduct: boolean = false;

  ngOnInit() {
    this.loadComposition();

    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      if (term.length >= 2) {
        this.searchMaterials(term);
      } else {
        this.searchResults = [];
      }
    });

    this.subProductSearchSubject.pipe(debounceTime(300)).subscribe((term) => {
      if (term.length >= 2) {
        this.searchSubProducts(term);
      } else {
        this.subProductSearchResults = [];
      }
    });
  }

  loadComposition() {
    this.productService.getComposition(this.product.id).subscribe({
      next: (composition) => {
        this.composition = composition.map((item: any) => ({
          materialId: item.materialId ?? undefined,
          subProductId: item.subProductId ?? undefined,
          quantity: item.quantity,
          materialName: item.material?.name || item.subProduct?.name || 'Desconhecido',
          unitCost: item.material?.unitCost ?? item.subProduct?.costPrice ?? 0,
        }));
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Erro ao carregar composição:', e);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Tipo de item
  // ---------------------------------------------------------------------------

  get isMaterialMode(): boolean {
    return this.selectedItemType === 'material';
  }

  get isSubProductMode(): boolean {
    return this.selectedItemType === 'sub_product';
  }

  setItemType(type: ItemType): void {
    this.selectedItemType = type;
    this.clearSelection();
  }

  private clearSelection(): void {
    this.searchTerm = '';
    this.selectedMaterial = null;
    this.searchResults = [];
    this.subProductSearchTerm = '';
    this.selectedSubProduct = null;
    this.subProductSearchResults = [];
    this.newQuantity = 0;
  }

  // ---------------------------------------------------------------------------
  // Busca matéria-prima
  // ---------------------------------------------------------------------------

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  searchMaterials(term: string) {
    this.isSearching = true;
    this.primaryMaterialService.getAll(1, 20, { search: term, active: true }).subscribe({
      next: (response) => {
        this.searchResults = response.data;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao buscar matérias-primas');
        this.isSearching = false;
      },
    });
  }

  selectMaterial(material: PrimaryMaterial) {
    this.selectedMaterial = material;
    this.searchTerm = material.name;
    this.searchResults = [];
  }

  // ---------------------------------------------------------------------------
  // Busca subproduto
  // ---------------------------------------------------------------------------

  onSubProductSearchChange() {
    this.subProductSearchSubject.next(this.subProductSearchTerm);
  }

  searchSubProducts(term: string) {
    this.isSearchingSubProduct = true;
    this.productService
      .getAll(1, 20, { search: term, active: true, productType: 'SEMI_MANUFACTURED' })
      .subscribe({
        next: (response) => {
          this.subProductSearchResults = response.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            costPrice: p.costPrice,
            unit: p.unit,
          }));
          this.isSearchingSubProduct = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notification.error('Erro ao buscar subprodutos');
          this.isSearchingSubProduct = false;
        },
      });
  }

  selectSubProduct(product: SubProductOption) {
    this.selectedSubProduct = product;
    this.subProductSearchTerm = product.name;
    this.subProductSearchResults = [];
  }

  // ---------------------------------------------------------------------------
  // Adicionar item
  // ---------------------------------------------------------------------------

  addCompositionItem() {
    const quantity = Number(this.newQuantity);

    if (this.isMaterialMode) {
      if (!this.selectedMaterial || quantity <= 0) {
        this.notification.warning('Selecione uma matéria-prima e informe a quantidade válida');
        return;
      }

      this.composition.push({
        materialId: Number(this.selectedMaterial.id),
        subProductId: undefined,
        quantity,
        materialName: this.selectedMaterial.name,
        unitCost: this.selectedMaterial.unitCost,
      });
    } else {
      if (!this.selectedSubProduct || quantity <= 0) {
        this.notification.warning('Selecione um subproduto e informe a quantidade válida');
        return;
      }

      this.composition.push({
        materialId: undefined,
        subProductId: this.selectedSubProduct.id,
        quantity,
        materialName: this.selectedSubProduct.name,
        unitCost: this.selectedSubProduct.costPrice,
      });
    }

    this.clearSelection();
  }

  removeCompositionItem(index: number) {
    this.composition.splice(index, 1);
  }

  isSubProductItem(item: CompositionItem): boolean {
    return !!item.subProductId;
  }

  // ---------------------------------------------------------------------------
  // Totais
  // ---------------------------------------------------------------------------

  getTotalCost(): number {
    return this.composition.reduce((total, item) => {
      return total + (item.unitCost ?? 0) * item.quantity;
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // ---------------------------------------------------------------------------
  // Save / Cancel
  // ---------------------------------------------------------------------------

  onSave() {
    const validComposition = this.composition.filter((item) => {
      const qty = Number(item.quantity);
      return !isNaN(qty) && qty > 0;
    });

    if (validComposition.length === 0) {
      this.notification.warning('Adicione pelo menos um item com quantidade válida');
      return;
    }

    const compositionDto: UpdateCompositionDTO = {
      composition: validComposition.map((item) => ({
        materialId: item.materialId,
        subProductId: item.subProductId,
        quantity: Number(item.quantity),
        materialName: item.materialName,
        unitCost: Number(item.unitCost),
      })),
    };

    this.productService.updateComposition(this.product.id, compositionDto).subscribe({
      next: () => {
        this.notification.success('Composição atualizada com sucesso!');
        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar composição: ${e.error?.message || e.message}`);
      },
    });
  }

  onCancel() {
    this.closeModal.emit();
  }
}
