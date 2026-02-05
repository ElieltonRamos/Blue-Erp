import { Component, EventEmitter, inject, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  Product,
  ProductService,
  UpdatePreparationDTO,
  PreparationStep,
} from '../../services/product.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-update-preparation-product',
  imports: [FormsModule, CommonModule],
  templateUrl: './modal-update-preparation-product.html',
})
export class ModalUpdatePreparationProduct implements OnInit {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  @Input() product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  preparationSteps: PreparationStep[] = [];
  newPreparationStep: PreparationStep = { order: 1, description: '' };

  ngOnInit() {
    this.loadPreparation();
  }

  loadPreparation() {
    this.productService.getPreparation(this.product.id).subscribe({
      next: (steps) => {
        this.preparationSteps = steps.map((step: any) => ({
          order: step.order,
          description: step.description,
        }));
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Erro ao carregar preparo:', e);
      },
    });
  }

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
    this.reorderSteps();
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

  onSave() {
    const preparationDto: UpdatePreparationDTO = {
      steps: this.preparationSteps,
    };

    this.productService.updatePreparation(this.product.id, preparationDto).subscribe({
      next: () => {
        this.notification.success('Modo de preparo atualizado com sucesso!');
        this.closeModal.emit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar preparo: ${e.error?.message || e.message}`);
      },
    });
  }

  onCancel() {
    this.closeModal.emit();
  }
}
