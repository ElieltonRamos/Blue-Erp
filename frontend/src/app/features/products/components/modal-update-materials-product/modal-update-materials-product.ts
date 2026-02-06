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
  newCompositionItem: CompositionItem = {
    materialId: 0,
    quantity: 0,
    materialName: '',
    unitCost: 0,
  };

  // Busca de matérias-primas
  searchTerm: string = '';
  searchResults: PrimaryMaterial[] = [];
  selectedMaterial: PrimaryMaterial | null = null;
  searchSubject = new Subject<string>();
  isSearching: boolean = false;

  ngOnInit() {
    this.loadComposition();

    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      if (term.length >= 2) {
        this.searchMaterials(term);
      } else {
        this.searchResults = [];
      }
    });
  }

  loadComposition() {
    this.productService.getComposition(this.product.id).subscribe({
      next: (composition) => {
        this.composition = composition.map((item: any) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          materialName: item.material?.name || 'Desconhecido',
          unitCost: item.material?.unitCost || 0,
        }));
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Erro ao carregar composição:', e);
      },
    });
  }

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
      error: (e) => {
        this.notification.error('Erro ao buscar matérias-primas');
        this.isSearching = false;
      },
    });
  }

  selectMaterial(material: PrimaryMaterial) {
    this.selectedMaterial = material;
    this.newCompositionItem.materialId = Number(material.id);
    this.newCompositionItem.materialName = material.name;
    this.searchTerm = material.name;
    this.searchResults = [];
  }

  addCompositionItem() {
    const quantity = Number(this.newCompositionItem.quantity);

    if (this.selectedMaterial && quantity > 0) {
      this.composition.push({
        materialId: this.newCompositionItem.materialId,
        quantity: quantity,
        materialName: this.newCompositionItem.materialName,
        unitCost: this.selectedMaterial.unitCost,
      });
      this.newCompositionItem = { materialId: 0, quantity: 0, materialName: '', unitCost: 0 };
      this.selectedMaterial = null;
      this.searchTerm = '';
      this.searchResults = [];
    } else {
      this.notification.warning(
        'Selecione uma matéria-prima e informe a quantidade válida (maior que zero)',
      );
    }
  }

  getTotalQuantity(): number {
    return this.composition.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalCost(): number {
    return this.composition.reduce((total, item) => {
      const unitCost = item.unitCost || 0;
      return total + unitCost * item.quantity;
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  removeCompositionItem(index: number) {
    this.composition.splice(index, 1);
  }

  onSave() {
    const validComposition = this.composition.filter((item) => {
      const qty = Number(item.quantity);
      return !isNaN(qty) && qty > 0;
    });

    if (validComposition.length === 0) {
      this.notification.warning('Adicione pelo menos uma matéria-prima com quantidade válida');
      return;
    }

    const compositionDto: UpdateCompositionDTO = {
      composition: validComposition.map((item) => ({
        materialId: item.materialId,
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
