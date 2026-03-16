import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PrimaryMaterialService } from '../../services/primary-material.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { CreatePrimaryMaterialDTO } from '../../types/primary-material';

@Component({
  selector: 'app-create-primary-material',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-primary-material.html',
})
export class CreatePrimaryMaterial implements OnInit {
  private notification = inject(NotificationService);
  formCreateMaterial!: FormGroup;
  isSubmitting = false;
  isLoadingCode = false;

  unitOptions = [
    { label: 'UN - Unidade', value: 'UN' },
    { label: 'KG - Quilograma', value: 'KG' },
    { label: 'LT - Litro', value: 'LT' },
    { label: 'MT - Metro', value: 'MT' },
    { label: 'CX - Caixa', value: 'CX' },
    { label: 'ML - Mililitro', value: 'ML' },
    { label: 'GR - Grama', value: 'GR' },
    { label: 'DZ - Dúzia', value: 'DZ' },
  ];

  private fb = inject(FormBuilder);
  private materialService = inject(PrimaryMaterialService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuggestedCode();
  }

  initializeForm(): void {
    this.formCreateMaterial = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      unit: ['UN', [Validators.required]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      expiryDate: [''],
      active: [true, [Validators.required]],
      ncm: ['', [Validators.minLength(8), Validators.maxLength(8)]],
      cfop: ['', [Validators.minLength(4), Validators.maxLength(4)]],
    });
  }

  loadSuggestedCode(): void {
    this.isLoadingCode = true;
    this.materialService.getSuggestedCode().subscribe({
      next: (response) => {
        this.formCreateMaterial.patchValue({ code: response.code.toString() });
        this.isLoadingCode = false;
      },
      error: (error) => {
        this.notification.error('Erro ao carregar código sugerido');
        this.isLoadingCode = false;
      },
    });
  }

  calculateTotalValue(): string {
    const currentStock = this.formCreateMaterial.get('currentStock')?.value || 0;
    const unitCost = this.formCreateMaterial.get('unitCost')?.value || 0;
    const total = currentStock * unitCost;
    return total.toFixed(2);
  }

  getStockStatus(): { status: string; class: string } {
    const currentStock = this.formCreateMaterial.get('currentStock')?.value || 0;
    const minimumStock = this.formCreateMaterial.get('minimumStock')?.value || 0;

    if (currentStock === 0) {
      return { status: 'Sem Estoque', class: 'text-red-400' };
    } else if (currentStock <= minimumStock) {
      return { status: 'Estoque Baixo', class: 'text-yellow-400' };
    } else {
      return { status: 'Estoque Normal', class: 'text-green-400' };
    }
  }

  onSubmit(): void {
    if (this.formCreateMaterial.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.formCreateMaterial.value;

      const material: CreatePrimaryMaterialDTO = {
        name: formValue.name,
        code: formValue.code,
        unit: formValue.unit,
        unitCost: Number(formValue.unitCost),
        currentStock: Number(formValue.currentStock),
        minStock: formValue.minimumStock ? Number(formValue.minimumStock) : undefined,
        expiryDate: formValue.expiryDate ? new Date(formValue.expiryDate) : undefined,
        active: formValue.active,
        ncm: formValue.ncm || undefined,
        cfop: formValue.cfop || undefined,
      };

      this.materialService.create(material).subscribe({
        next: (response) => {
          this.notification.success('Matéria-prima cadastrada com sucesso!');
          this.router.navigate(['/materials']);
        },
        error: (error) => {
          this.notification.error('Erro ao cadastrar matéria-prima');
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } else {
      Object.keys(this.formCreateMaterial.controls).forEach((key) => {
        this.formCreateMaterial.get(key)?.markAsTouched();
      });
    }
  }
}
