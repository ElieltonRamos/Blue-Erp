import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  AbstractControl,
} from '@angular/forms';
import { PrimaryMaterial } from '../../types/primary-material';
import { PrimaryMaterialService } from '../../services/primary-material.service';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { debounceTime, Subject } from 'rxjs';
import { ProductComposition } from '../../types/product';

type ItemType = 'material' | 'sub_product';

interface SubProductOption {
  id: number;
  name: string;
  code: string;
  costPrice: number;
  unit: string;
}

@Component({
  selector: 'app-product-composition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-composition.html',
})
export class ProductCompositionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private primaryMaterialService = inject(PrimaryMaterialService);
  private productService = inject(ProductService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  @Input() productName: string = '';
  @Output() compositionChange = new EventEmitter<ProductComposition>();

  compositionForm!: FormGroup;

  // Tipo de item sendo adicionado
  selectedItemType: ItemType = 'material';

  // Busca de matérias-primas
  searchTerm: string = '';
  searchResults: PrimaryMaterial[] = [];
  selectedMaterial: PrimaryMaterial | null = null;
  searchSubject = new Subject<string>();
  isSearching: boolean = false;

  // Busca de subprodutos (SEMI_MANUFACTURED)
  subProductSearchTerm: string = '';
  subProductSearchResults: SubProductOption[] = [];
  selectedSubProduct: SubProductOption | null = null;
  subProductSearchSubject = new Subject<string>();
  isSearchingSubProduct: boolean = false;

  newQuantity: number = 0;

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearch();
    this.setupSubProductSearch();
  }

  initializeForm(): void {
    this.compositionForm = this.fb.group({
      compositionItems: this.fb.array([]),
      preparationSteps: this.fb.array([]),
    });

    this.compositionForm.valueChanges.subscribe(() => {
      this.emitCompositionChange();
    });
  }

  setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      if (term.length >= 2) {
        this.searchMaterials(term);
      } else {
        this.searchResults = [];
      }
    });
  }

  setupSubProductSearch(): void {
    this.subProductSearchSubject.pipe(debounceTime(300)).subscribe((term) => {
      if (term.length >= 2) {
        this.searchSubProducts(term);
      } else {
        this.subProductSearchResults = [];
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get compositionItems(): FormArray {
    return this.compositionForm.get('compositionItems') as FormArray;
  }

  get preparationSteps(): FormArray {
    return this.compositionForm.get('preparationSteps') as FormArray;
  }

  get isMaterialMode(): boolean {
    return this.selectedItemType === 'material';
  }

  get isSubProductMode(): boolean {
    return this.selectedItemType === 'sub_product';
  }

  // ---------------------------------------------------------------------------
  // Tipo de item
  // ---------------------------------------------------------------------------

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
  // Busca de matérias-primas
  // ---------------------------------------------------------------------------

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  searchMaterials(term: string): void {
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

  selectMaterial(material: PrimaryMaterial): void {
    this.selectedMaterial = material;
    this.searchTerm = material.name;
    this.searchResults = [];
  }

  // ---------------------------------------------------------------------------
  // Busca de subprodutos
  // ---------------------------------------------------------------------------

  onSubProductSearchChange(): void {
    this.subProductSearchSubject.next(this.subProductSearchTerm);
  }

  searchSubProducts(term: string): void {
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

  selectSubProduct(product: SubProductOption): void {
    this.selectedSubProduct = product;
    this.subProductSearchTerm = product.name;
    this.subProductSearchResults = [];
  }

  // ---------------------------------------------------------------------------
  // Adicionar item à composição
  // ---------------------------------------------------------------------------

  addMaterial(): void {
    const quantity = Number(this.newQuantity);

    if (this.isMaterialMode) {
      this.addMaterialItem(quantity);
    } else {
      this.addSubProductItem(quantity);
    }
  }

  private addMaterialItem(quantity: number): void {
    if (!this.selectedMaterial || quantity <= 0) {
      this.notification.warning('Selecione uma matéria-prima e informe a quantidade válida');
      return;
    }

    const existingIndex = this.compositionItems.controls.findIndex(
      (control) => control.get('materialId')?.value === Number(this.selectedMaterial!.id),
    );

    if (existingIndex >= 0) {
      const existing = this.compositionItems.at(existingIndex);
      const currentQty = existing.get('quantity')?.value ?? 0;
      existing.patchValue({ quantity: currentQty + quantity });
    } else {
      const itemGroup = this.buildMaterialGroup(this.selectedMaterial, quantity);
      this.compositionItems.push(itemGroup);
    }

    this.clearSelection();
  }

  private addSubProductItem(quantity: number): void {
    if (!this.selectedSubProduct || quantity <= 0) {
      this.notification.warning('Selecione um subproduto e informe a quantidade válida');
      return;
    }

    const existingIndex = this.compositionItems.controls.findIndex(
      (control) => control.get('subProductId')?.value === this.selectedSubProduct!.id,
    );

    if (existingIndex >= 0) {
      const existing = this.compositionItems.at(existingIndex);
      const currentQty = existing.get('quantity')?.value ?? 0;
      existing.patchValue({ quantity: currentQty + quantity });
    } else {
      const itemGroup = this.buildSubProductGroup(this.selectedSubProduct, quantity);
      this.compositionItems.push(itemGroup);
    }

    this.clearSelection();
  }

  private buildMaterialGroup(material: PrimaryMaterial, quantity: number): FormGroup {
    const group = this.fb.group({
      materialId: [Number(material.id), Validators.required],
      subProductId: [null as number | null],
      materialName: [material.name, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(0.01)]],
      unit: [material.unit],
      unitCost: [material.unitCost],
      totalCost: [material.unitCost * quantity],
    });

    group.get('quantity')?.valueChanges.subscribe((qty) => {
      const unitCost = group.get('unitCost')?.value ?? 0;
      group.patchValue({ totalCost: (qty ?? 0) * unitCost }, { emitEvent: false });
      this.emitCompositionChange();
    });

    return group;
  }

  private buildSubProductGroup(product: SubProductOption, quantity: number): FormGroup {
    const group = this.fb.group({
      materialId: [null as number | null],
      subProductId: [product.id, Validators.required],
      materialName: [product.name, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(0.01)]],
      unit: [product.unit],
      unitCost: [product.costPrice],
      totalCost: [product.costPrice * quantity],
    });

    group.get('quantity')?.valueChanges.subscribe((qty) => {
      const unitCost = group.get('unitCost')?.value ?? 0;
      group.patchValue({ totalCost: (qty ?? 0) * unitCost }, { emitEvent: false });
      this.emitCompositionChange();
    });

    return group;
  }

  // ---------------------------------------------------------------------------
  // Remover item
  // ---------------------------------------------------------------------------

  removeMaterial(index: number): void {
    this.compositionItems.removeAt(index);
  }

  // ---------------------------------------------------------------------------
  // Passos de preparo
  // ---------------------------------------------------------------------------

  addPreparationStep(): void {
    const stepGroup = this.fb.group({
      order: [this.preparationSteps.length + 1, Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.preparationSteps.push(stepGroup);
  }

  removePreparationStep(index: number): void {
    this.preparationSteps.removeAt(index);
    this.reorderSteps();
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const step = this.preparationSteps.at(index);
      this.preparationSteps.removeAt(index);
      this.preparationSteps.insert(index - 1, step);
      this.reorderSteps();
    }
  }

  moveStepDown(index: number): void {
    if (index < this.preparationSteps.length - 1) {
      const step = this.preparationSteps.at(index);
      this.preparationSteps.removeAt(index);
      this.preparationSteps.insert(index + 1, step);
      this.reorderSteps();
    }
  }

  private reorderSteps(): void {
    this.preparationSteps.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  // ---------------------------------------------------------------------------
  // Utilitários
  // ---------------------------------------------------------------------------

  getTotalCost(): number {
    return this.compositionItems.controls.reduce((sum, item) => {
      return sum + (item.get('totalCost')?.value ?? 0);
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  isSubProductItem(item: AbstractControl): boolean {
    return !!item.get('subProductId')?.value;
  }

  emitCompositionChange(): void {
    const composition: ProductComposition = {
      items: this.compositionItems.value,
      preparationSteps: this.preparationSteps.value,
      totalCost: this.getTotalCost(),
    };

    this.compositionChange.emit(composition);
  }

  isCompositionValid(): boolean {
    return this.compositionForm.valid && this.compositionItems.length > 0;
  }

  resetComposition(): void {
    this.compositionItems.clear();
    this.preparationSteps.clear();
    this.clearSelection();
    this.selectedItemType = 'material';
  }
}
