import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import Product, { Unit } from '../../types/product';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-product.html',
})
export class CreateProduct {
  private notification = inject(NotificationService);
  formCreateProduct = new FormGroup({
    name: new FormControl('', [Validators.required]),
    code: new FormControl('', [Validators.required]),
    price: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    costPrice: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    ncm: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    cest: new FormControl('', [Validators.pattern(/^\d{7}$/)]),
    csosn: new FormControl('102', [Validators.required]),
    unit: new FormControl(Unit.UN, [Validators.required]),
    origin: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(8)]),
    quantity: new FormControl(0, [Validators.required, Validators.min(0)]),
    active: new FormControl(true, [Validators.required]),
  });

  private productService = inject(ProductService);

  // Expor o enum Unit para o template
  unitOptions = Object.values(Unit);

  // Opções de CSOSN válidas para NFC-e
  csosnOptions = [
    { value: '102', label: '102 - Tributação SN sem permissão de crédito' },
    { value: '103', label: '103 - Tributação SN com isenção' },
    { value: '300', label: '300 - Imune' },
    { value: '400', label: '400 - Não tributada pelo SN' },
    { value: '500', label: '500 - ICMS cobrado anteriormente' },
    { value: '900', label: '900 - Outros' },
  ];

  // Opções de origem do produto
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

  ngOnInit() {
    this.getSugestionCode();
  }

  onSubmit() {
    const formValue = this.formCreateProduct.value;

    const newProduct: Product = {
      name: formValue.name || '',
      code: formValue.code || '',
      price: formValue.price ? parseFloat(formValue.price.toString()) : 0,
      costPrice: formValue.costPrice ? parseFloat(formValue.costPrice.toString()) : 0,
      ncm: formValue.ncm || '',
      cest: formValue.cest || '',
      csosn: formValue.csosn || '',
      unit: formValue.unit || Unit.UN,
      origin: formValue.origin ?? 0,
      quantity: formValue.quantity ? parseInt(formValue.quantity.toString(), 10) : 0,
      active: formValue.active ?? true,
    };

    if (this.formCreateProduct.valid) {
      this.productService.createProduct(newProduct).subscribe({
        next: (response) => {
          this.notification.success(`Produto ${response.name} registrado com sucesso!`)
          this.formCreateProduct.reset({
            unit: Unit.UN,
            origin: 0,
            active: true,
            quantity: 0,
            price: 0,
            costPrice: 0,
          });
          this.getSugestionCode();
        },
        error: (e) => {
          this.notification.error(`Erro ao registrar Produto: ${e.error.message}`);
          this.formCreateProduct.markAllAsTouched();
        },
      });
    } else {
      this.formCreateProduct.markAllAsTouched();
    }
  }

  getSugestionCode() {
    this.productService.getSugestionCode().subscribe({
      next: (response) => {
        this.formCreateProduct.patchValue({ code: response.code.toString() });
      },
      error: (e) => {
        this.notification.error(`Erro ao obter código sugerido: ${e.error.message}`);
      },
    });
  }

  calculateProfitMargin(): string {
    const price = this.formCreateProduct.get('price')?.value || 0;
    const costPrice = this.formCreateProduct.get('costPrice')?.value || 0;

    if (costPrice === 0) return '0.00';

    const margin = ((price - costPrice) / costPrice) * 100;
    return margin.toFixed(2);
  }
}
