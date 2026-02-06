import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Product, productionLocationOptions, UpdateProductDTO } from '../../types/product';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';

@Component({
  selector: 'app-modal-update-basic-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-update-basic-product.html',
})
export class ModalUpdateBasicProduct {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);

  @Input() product!: Product;
  @Output() closeModal = new EventEmitter<void>();
  @Output() productUpdated = new EventEmitter<Product>();

  editableProductType: 'MANUFACTURED' | 'RESALE' = 'RESALE';
  productionLocationOptions = productionLocationOptions;

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

    // Garante valor default
    if (this.product.extraCosts == null) {
      this.product.extraCosts = 0;
    }
  }

  async onProductTypeChange() {
    if (this.editableProductType === 'RESALE') {
      const confirmed = await alertConfirm(
        'Ao mudar para Revenda, a composição e o modo de preparo serão perdidos. Deseja continuar?',
      );

      if (!confirmed) {
        this.editableProductType = 'MANUFACTURED';
      }
    }
  }

  onSave() {
    if (!this.validateForm()) {
      this.notification.error('Por favor, preencha todos os campos obrigatórios corretamente');
      return;
    }

    const updateDto: UpdateProductDTO = {
      name: this.product.name,
      code: this.product.code,
      price: this.product.price,
      costPrice: this.product.costPrice,
      extraCosts: this.product.extraCosts || 0, // 👈 NOVO
      ncm: this.product.ncm,
      cest: this.product.cest || undefined,
      csosn: this.product.csosn || undefined,
      unit: this.product.unit,
      origin: this.product.origin,
      quantity: this.product.quantity,
      minStock: this.product.minStock || undefined,
      productionLocation: this.product.productionLocation || undefined,
      active: this.product.active,
      productType: this.editableProductType,
    };

    this.productService.update(this.product.id, updateDto).subscribe({
      next: (updatedProduct) => {
        this.notification.success('Produto atualizado com sucesso!');
        this.productUpdated.emit(updatedProduct);
        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar produto: ${e.error?.message || e.message}`);
      },
    });
  }

  validateForm(): boolean {
    const { name, code, price, ncm, unit, origin } = this.product;

    return !!(name && code && price != null && ncm && unit && origin !== undefined);
  }

  onCancel() {
    this.closeModal.emit();
  }

  calculateProfitMargin(): number {
    const price = this.product.price || 0;
    const cost = this.product.costPrice || 0;
    const extra = this.product.extraCosts || 0;

    const totalCost = cost + extra;

    if (price === 0 || totalCost === 0) {
      return 0;
    }

    return ((price - totalCost) / totalCost) * 100;
  }

  get isManufactured(): boolean {
    return this.editableProductType === 'MANUFACTURED';
  }
}
