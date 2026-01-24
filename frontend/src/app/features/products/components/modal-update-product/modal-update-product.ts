import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import Product, { Unit } from '../../types/product';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-update-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-update-product.html',
})
export class ModalUpdateProduct {
  private notification = inject(NotificationService);
  @Input() product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  private productService = inject(ProductService);

  // Expor enums e opções para o template
  unitOptions = Object.values(Unit);

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
    {
      value: 6,
      label: '6 - Estrangeira (importação direta) sem similar nacional',
    },
    {
      value: 7,
      label: '7 - Estrangeira (mercado interno) sem similar nacional',
    },
    { value: 8, label: '8 - Nacional com conteúdo importado > 70%' },
  ];

  onSave() {
    if (!this.validateForm()) {
      this.notification.error('Por favor, preencha todos os campos obrigatórios corretamente');
      return;
    }

    this.productService.updateProduct(this.product).subscribe({
      next: () => {
        this.notification.success('Produto atualizado com sucesso!');
        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar produto: ${e.error?.message || e.message}`);
      },
    });
  }

  validateForm(): boolean {
    const { name, code, price, ncm, csosn, unit, origin } = this.product;
    return !!(name && code && price && ncm && csosn && unit && origin !== undefined);
  }

  onCancel() {
    this.closeModal.emit();
  }

  calculateProfitMargin(): number {
    if (this.product.costPrice === 0) return 0;
    return ((this.product.price - this.product.costPrice) / this.product.costPrice) * 100;
  }
}
