// primary-material-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface PrimaryMaterial {
  id?: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  expiryDate?: Date;
  active: boolean;
}

@Component({
  selector: 'app-create-primary-material',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-primary-material.html',
})
export class CreatePrimaryMaterial implements OnInit {
  formCreateMaterial!: FormGroup;

  unitOptions = [
    'UN - Unidade',
    'KG - Quilograma',
    'G - Grama',
    'L - Litro',
    'ML - Mililitro',
    'M - Metro',
    'CM - Centímetro',
    'CX - Caixa',
    'PC - Pacote',
    'SC - Saco'
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.formCreateMaterial = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required]],
      unit: ['UN - Unidade', [Validators.required]],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      unitCost: [0, [Validators.required, Validators.min(0.01)]],
      expiryDate: [''],
      active: [true, [Validators.required]]
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
    if (this.formCreateMaterial.valid) {
      const material: PrimaryMaterial = this.formCreateMaterial.value;
      console.log('Material cadastrado:', material);
      
      // Implementar lógica de salvamento
      alert('Matéria-prima cadastrada com sucesso!');
      
      // Resetar formulário
      // this.formCreateMaterial.reset({ unit: 'UN - Unidade', active: true });
    } else {
      // Marcar todos os campos como touched para mostrar erros
      Object.keys(this.formCreateMaterial.controls).forEach(key => {
        this.formCreateMaterial.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    if (confirm('Deseja cancelar o cadastro? Todas as informações serão perdidas.')) {
      this.formCreateMaterial.reset({ unit: 'UN - Unidade', active: true });
    }
  }
}