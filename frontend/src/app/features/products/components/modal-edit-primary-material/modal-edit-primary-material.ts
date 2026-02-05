import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { PrimaryMaterial, PrimaryMaterialService } from '../../services/primary-material.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-update-primary-material',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-edit-primary-material.html',
})
export class ModalUpdatePrimaryMaterial {
  private notification = inject(NotificationService);
  @Input() material!: PrimaryMaterial;
  @Output() closeModal = new EventEmitter<void>();

  private primaryMaterialService = inject(PrimaryMaterialService);

  unitOptions = ['UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ', 'PC', 'PCT'];

  onSave() {
    if (!this.validateForm()) {
      this.notification.error('Por favor, preencha todos os campos obrigatórios corretamente');
      return;
    }

    const updateDTO = {
      name: this.material.name,
      code: this.material.code,
      unit: this.material.unit,
      unitCost: this.material.unitCost,
      currentStock: this.material.currentStock,
      minStock: this.material.minStock,
      expiryDate: this.material.expiryDate,
      active: this.material.active,
      ncm: this.material.ncm,
      cfop: this.material.cfop,
    };

    this.primaryMaterialService.update(this.material.id, updateDTO).subscribe({
      next: () => {
        this.notification.success('Material atualizado com sucesso!');
        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar material: ${e.error?.message || e.message}`);
      },
    });
  }

  validateForm(): boolean {
    const { name, code, unit, unitCost } = this.material;
    return !!(name && code && unit && unitCost >= 0);
  }

  onCancel() {
    this.closeModal.emit();
  }

  calculateStockValue(): number {
    return this.material.currentStock * this.material.unitCost;
  }

  isStockLow(): boolean {
    if (!this.material.minStock) return false;
    return this.material.currentStock <= this.material.minStock;
  }

  isExpiringSoon(): boolean {
    if (!this.material.expiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(this.material.expiryDate);
    const diffDays = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }

  isExpired(): boolean {
    if (!this.material.expiryDate) return false;
    return new Date(this.material.expiryDate) < new Date();
  }
}
