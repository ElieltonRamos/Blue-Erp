// modal-update-product.ts
import { Component, EventEmitter, inject, Input, Output, OnInit, ViewChild } from '@angular/core';
import {
  Product,
  ProductService,
  UpdateProductDTO,
  UpdateCompositionDTO,
  UpdatePreparationDTO,
  CompositionItem,
  PreparationStep,
} from '../../services/product.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { productionLocationOptions } from '../../types/product';

@Component({
  selector: 'app-modal-update-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-update-product.html',
})
export class ModalUpdateProduct implements OnInit {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);

  @Input() product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  // Dados do produto completos
  productDetails: any = null;
  editableProductType: 'MANUFACTURED' | 'RESALE' = 'RESALE';
  productionLocation = productionLocationOptions

  // Composição e preparo
  composition: CompositionItem[] = [];
  preparationSteps: PreparationStep[] = [];

  // Novo item de composição
  newCompositionItem: CompositionItem = { materialId: 0, quantity: 0 };

  // Novo passo de preparo
  newPreparationStep: PreparationStep = { order: 1, description: '' };

  // Tabs
  activeTab: 'basic' | 'composition' | 'preparation' = 'basic';

  // Expor enums e opções para o template
  unitOptions = ['UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ'];

  csosnOptions = [
    { value: '102', label: '102 - Tributação SN sem permissão de crédito' },
    { value: '103', label: '103 - Tributação SN com isenção' },
    { value: '300', label: '300 - Imune' },
    { value: '400', label: '400 - Não tributada pelo SN' },
    { value: '500', label: '500 - ICMS cobrado anteriormente' },
    { value: '900', label: '900 - Outros' },
  ];

  originOptions = [
    { value: 0, label: '0 - Nacional' },
    { value: 1, label: '1 - Estrangeira (importação direta)' },
    { value: 2, label: '2 - Estrangeira (adquirida no mercado interno)' },
    { value: 3, label: '3 - Nacional com conteúdo importado > 40%' },
    { value: 4, label: '4 - Nacional conforme processos produtivos básicos' },
    { value: 5, label: '5 - Nacional com conteúdo importado <= 40%' },
    { value: 6, label: '6 - Estrangeira (importação direta) sem similar nacional' },
    { value: 7, label: '7 - Estrangeira (mercado interno) sem similar nacional' },
    { value: 8, label: '8 - Nacional com conteúdo importado > 70%' },
  ];

  ngOnInit() {
    this.editableProductType = this.product.productType as 'MANUFACTURED' | 'RESALE';
    this.loadProductDetails();
  }

  onProductTypeChange() {
    // Se mudar para RESALE, limpar composição e preparo
    if (this.editableProductType === 'RESALE') {
      this.composition = [];
      this.preparationSteps = [];
    }
  }

  loadProductDetails() {
    // Carregar detalhes completos do produto
    this.productService.getById(this.product.id).subscribe({
      next: (details) => {
        this.productDetails = details;

        // Carregar composição se produto for MANUFACTURED
        if (details.productType === 'MANUFACTURED') {
          this.loadComposition();
          this.loadPreparation();
        }
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar detalhes: ${e.error?.message || e.message}`);
      },
    });
  }

  loadComposition() {
    this.productService.getComposition(this.product.id).subscribe({
      next: (composition) => {
        this.composition = composition.map((item: any) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          materialName: item.material?.name || 'Desconhecido',
        }));
      },
      error: (e) => {
        console.error('Erro ao carregar composição:', e);
      },
    });
  }

  loadPreparation() {
    this.productService.getPreparation(this.product.id).subscribe({
      next: (steps) => {
        this.preparationSteps = steps.map((step: any) => ({
          order: step.order,
          description: step.description,
        }));
      },
      error: (e) => {
        console.error('Erro ao carregar preparo:', e);
      },
    });
  }

  onSaveBasic() {
    if (!this.validateForm()) {
      this.notification.error('Por favor, preencha todos os campos obrigatórios corretamente');
      return;
    }

    const updateDto: UpdateProductDTO = {
      name: this.product.name,
      code: this.product.code,
      price: this.product.price,
      costPrice: this.product.costPrice,
      ncm: this.product.ncm,
      cest: this.product.cest || undefined,
      csosn: this.product.csosn || undefined,
      unit: this.product.unit,
      origin: this.product.origin,
      quantity: this.product.quantity,
      minStock: this.product.minStock || undefined,
      productionLocation: this.product.productionLocation,
      active: this.product.active,
      productType: this.editableProductType, // Adicionar tipo de produto
    };

    this.productService.update(this.product.id, updateDto).subscribe({
      next: () => {
        this.notification.success('Produto atualizado com sucesso!');

        // Se mudou de tipo, recarregar detalhes
        if (this.editableProductType !== this.product.productType) {
          this.product.productType = this.editableProductType;
          this.loadProductDetails();
        }

        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar produto: ${e.error?.message || e.message}`);
      },
    });
  }

  get isManufactured(): boolean {
    return this.editableProductType === 'MANUFACTURED';
  }

  get canShowCompositionTab(): boolean {
    return this.editableProductType === 'MANUFACTURED';
  }

  // Gerenciar composição
  addCompositionItem() {
    if (this.newCompositionItem.materialId && this.newCompositionItem.quantity > 0) {
      this.composition.push({ ...this.newCompositionItem });
      this.newCompositionItem = { materialId: 0, quantity: 0 };
    }
  }

  removeCompositionItem(index: number) {
    this.composition.splice(index, 1);
  }

  onSaveComposition() {
    const compositionDto: UpdateCompositionDTO = {
      composition: this.composition.map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
      })),
    };

    this.productService.updateComposition(this.product.id, compositionDto).subscribe({
      next: () => {
        this.notification.success('Composição atualizada com sucesso!');
        this.loadComposition();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar composição: ${e.error?.message || e.message}`);
      },
    });
  }

  // Gerenciar passos de preparo
  addPreparationStep() {
    if (this.newPreparationStep.description.trim()) {
      const nextOrder = this.preparationSteps.length + 1;
      this.preparationSteps.push({
        order: nextOrder,
        description: this.newPreparationStep.description,
      });
      this.newPreparationStep = { order: nextOrder + 1, description: '' };
    }
  }

  removePreparationStep(index: number) {
    this.preparationSteps.splice(index, 1);
    // Reordenar
    this.preparationSteps.forEach((step, i) => {
      step.order = i + 1;
    });
  }

  moveStepUp(index: number) {
    if (index > 0) {
      [this.preparationSteps[index], this.preparationSteps[index - 1]] = [
        this.preparationSteps[index - 1],
        this.preparationSteps[index],
      ];
      this.reorderSteps();
    }
  }

  moveStepDown(index: number) {
    if (index < this.preparationSteps.length - 1) {
      [this.preparationSteps[index], this.preparationSteps[index + 1]] = [
        this.preparationSteps[index + 1],
        this.preparationSteps[index],
      ];
      this.reorderSteps();
    }
  }

  reorderSteps() {
    this.preparationSteps.forEach((step, i) => {
      step.order = i + 1;
    });
  }

  onSavePreparation() {
    const preparationDto: UpdatePreparationDTO = {
      steps: this.preparationSteps,
    };

    this.productService.updatePreparation(this.product.id, preparationDto).subscribe({
      next: () => {
        this.notification.success('Modo de preparo atualizado com sucesso!');
        this.loadPreparation();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar preparo: ${e.error?.message || e.message}`);
      },
    });
  }

  validateForm(): boolean {
    const { name, code, price, ncm, unit, origin } = this.product;
    return !!(name && code && price && ncm && unit && origin !== undefined);
  }

  onCancel() {
    this.closeModal.emit();
  }

  calculateProfitMargin(): number {
    if (this.product.costPrice === 0) return 0;
    return ((this.product.price - this.product.costPrice) / this.product.costPrice) * 100;
  }

  setActiveTab(tab: 'basic' | 'composition' | 'preparation') {
    this.activeTab = tab;
  }
}
