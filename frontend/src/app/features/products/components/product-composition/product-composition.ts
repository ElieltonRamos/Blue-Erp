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
} from '@angular/forms';
import { PrimaryMaterial } from '../../types/primary-material';
import { PrimaryMaterialService } from '../../services/primary-material.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { debounceTime, Subject } from 'rxjs';
import { ProductComposition } from '../../types/product';

@Component({
  selector: 'app-product-composition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-composition.html',
})
export class ProductCompositionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private primaryMaterialService = inject(PrimaryMaterialService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  @Input() productName: string = '';
  @Output() compositionChange = new EventEmitter<ProductComposition>();

  compositionForm!: FormGroup;

  // Busca de matérias-primas
  searchTerm: string = '';
  searchResults: PrimaryMaterial[] = [];
  selectedMaterial: PrimaryMaterial | null = null;
  searchSubject = new Subject<string>();
  isSearching: boolean = false;
  newQuantity: number = 0;

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearch();
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

  get compositionItems(): FormArray {
    return this.compositionForm.get('compositionItems') as FormArray;
  }

  get preparationSteps(): FormArray {
    return this.compositionForm.get('preparationSteps') as FormArray;
  }

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

  addMaterial(): void {
    const quantity = Number(this.newQuantity);

    if (!this.selectedMaterial || quantity <= 0) {
      this.notification.warning('Selecione uma matéria-prima e informe a quantidade válida');
      return;
    }

    // Verificar se material já existe
    const existingIndex = this.compositionItems.controls.findIndex(
      (control) => control.get('materialId')?.value === Number(this.selectedMaterial!.id),
    );

    if (existingIndex >= 0) {
      const existingControl = this.compositionItems.at(existingIndex);
      const currentQty = existingControl.get('quantity')?.value || 0;
      existingControl.patchValue({ quantity: currentQty + quantity });
    } else {
      const itemGroup = this.fb.group({
        materialId: [Number(this.selectedMaterial.id), Validators.required],
        materialName: [this.selectedMaterial.name, Validators.required],
        quantity: [quantity, [Validators.required, Validators.min(0.01)]],
        unit: [this.selectedMaterial.unit],
        unitCost: [this.selectedMaterial.unitCost],
        totalCost: [this.selectedMaterial.unitCost * quantity],
      });

      itemGroup.get('quantity')?.valueChanges.subscribe((qty) => {
        const unitCost = itemGroup.get('unitCost')?.value || 0;
        const total = (qty || 0) * unitCost;
        itemGroup.patchValue({ totalCost: total }, { emitEvent: false });
        this.emitCompositionChange();
      });

      this.compositionItems.push(itemGroup);
    }

    this.selectedMaterial = null;
    this.searchTerm = '';
    this.newQuantity = 0;
    this.searchResults = [];
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

    this.preparationSteps.controls.forEach((control, i) => {
      control.patchValue({ order: i + 1 });
    });
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const step = this.preparationSteps.at(index);
      this.preparationSteps.removeAt(index);
      this.preparationSteps.insert(index - 1, step);

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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
    this.searchTerm = '';
    this.selectedMaterial = null;
    this.newQuantity = 0;
    this.searchResults = [];
  }
}
