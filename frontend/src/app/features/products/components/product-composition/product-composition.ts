// product-composition.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { CompositionItem, PreparationStep, PrimaryMaterial, ProductComposition, ProductCompositionDTO } from '../../types/product';

@Component({
  selector: 'app-product-composition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-composition.html',
})
export class ProductCompositionComponent implements OnInit {
  @Input() productName: string = '';
  @Output() compositionChange = new EventEmitter<ProductComposition>();

  compositionForm!: FormGroup;
  showMaterialSearch: boolean = false;
  searchTerm: string = '';

  // Mock de matérias-primas disponíveis (em produção, virá de um serviço)
  availableMaterials: PrimaryMaterial[] = []

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.compositionForm = this.fb.group({
      compositionItems: this.fb.array([]),
      preparationSteps: this.fb.array([]),
    });

    // Emitir mudanças sempre que o formulário mudar
    this.compositionForm.valueChanges.subscribe(() => {
      this.emitCompositionChange();
    });
  }

  get compositionItems(): FormArray {
    return this.compositionForm.get('compositionItems') as FormArray;
  }

  get preparationSteps(): FormArray {
    return this.compositionForm.get('preparationSteps') as FormArray;
  }

  get filteredMaterials(): PrimaryMaterial[] {
    if (!this.searchTerm) {
      return this.availableMaterials;
    }

    const term = this.searchTerm.toLowerCase();
    return this.availableMaterials.filter(
      (m) => m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term),
    );
  }

  addMaterial(material: PrimaryMaterial): void {
    // Verificar se o material já foi adicionado
    const existingItem = this.compositionItems.controls.find(
      (control) => control.get('materialId')?.value === material.id,
    );

    if (existingItem) {
      // Se já existe, apenas incrementa a quantidade
      const currentQty = existingItem.get('quantity')?.value || 0;
      existingItem.patchValue({ quantity: currentQty + 1 });
      return;
    }

    const itemGroup = this.fb.group({
      materialId: [material.id, Validators.required],
      materialName: [material.name, Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit: [material.unit],
      unitCost: [material.unitCost],
      totalCost: [material.unitCost],
    });

    // Atualizar custo total quando quantidade mudar
    itemGroup.get('quantity')?.valueChanges.subscribe((qty) => {
      const unitCost = itemGroup.get('unitCost')?.value || 0;
      const total = (qty || 0) * unitCost;
      itemGroup.patchValue({ totalCost: total }, { emitEvent: false });
      this.emitCompositionChange();
    });

    this.compositionItems.push(itemGroup);
    this.showMaterialSearch = false;
    this.searchTerm = '';
  }

  removeMaterial(index: number): void {
    this.compositionItems.removeAt(index);
  }

  addPreparationStep(): void {
    const stepGroup = this.fb.group({
      order: [this.preparationSteps.length + 1, Validators.required],
      description: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.preparationSteps.push(stepGroup);
  }

  removePreparationStep(index: number): void {
    this.preparationSteps.removeAt(index);

    // Reordenar os steps
    this.preparationSteps.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const step = this.preparationSteps.at(index);
      this.preparationSteps.removeAt(index);
      this.preparationSteps.insert(index - 1, step);

      // Reordenar
      this.preparationSteps.controls.forEach((control, i) => {
        control.patchValue({ order: i + 1 });
      });
    }
  }

  moveStepDown(index: number): void {
    if (index < this.preparationSteps.length - 1) {
      const step = this.preparationSteps.at(index);
      this.preparationSteps.removeAt(index);
      this.preparationSteps.insert(index + 1, step);

      // Reordenar
      this.preparationSteps.controls.forEach((control, i) => {
        control.patchValue({ order: i + 1 });
      });
    }
  }

  getTotalCost(): number {
    return this.compositionItems.controls.reduce((sum, item) => {
      return sum + (item.get('totalCost')?.value || 0);
    }, 0);
  }

  emitCompositionChange(): void {
    const composition: ProductComposition = {
      items: this.compositionItems.value,
      preparationSteps: this.preparationSteps.value,
      totalCost: this.getTotalCost(),
    };

    this.compositionChange.emit(composition);
  }

  toggleMaterialSearch(): void {
    this.showMaterialSearch = !this.showMaterialSearch;
    if (!this.showMaterialSearch) {
      this.searchTerm = '';
    }
  }

  // Método para obter dados formatados para o backend
  getCompositionDTO(): ProductCompositionDTO {
    return {
      compositionItems: this.compositionItems.value.map((item: CompositionItem) => ({
        materialId: item.materialId,
        quantity: item.quantity,
      })),
      preparationSteps: this.preparationSteps.value.map((step: PreparationStep) => ({
        order: step.order,
        description: step.description,
      })),
    };
  }

  // Método para validar se a composição está válida
  isCompositionValid(): boolean {
    return this.compositionForm.valid && this.compositionItems.length > 0;
  }

  // Método para resetar o formulário
  resetComposition(): void {
    this.compositionItems.clear();
    this.preparationSteps.clear();
    this.showMaterialSearch = false;
    this.searchTerm = '';
  }
}