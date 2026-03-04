import { Component, inject, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CreateProductDTO, ProductComposition, Unit } from '../../types/product';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ProductCompositionComponent } from '../product-composition/product-composition';
import { ProductionLocationsService } from '../../../users/services/location.service';
import { CategoryService } from '../../services/category.service';
import Category from '../../types/category';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ProductCompositionComponent],
  templateUrl: './create-product.html',
})
export class CreateProduct implements OnInit {
  @ViewChild(ProductCompositionComponent) compositionComponent!: ProductCompositionComponent;

  private cdr = inject(ChangeDetectorRef);
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private locationsService = inject(ProductionLocationsService);
  private categoryService = inject(CategoryService);

  formCreateProduct = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    code: new FormControl<string>('', [Validators.required]),
    productType: new FormControl<string>('manufactured', [Validators.required]),
    productionLocation: new FormControl<string>('', [Validators.required]),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    costPrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    extraCosts: new FormControl<number | null>(null, [Validators.min(0)]),
    ncm: new FormControl<string>('', [Validators.pattern(/^\d{8}$/)]),
    cest: new FormControl<string>('', [Validators.pattern(/^\d{7}$/)]),
    csosn: new FormControl<string>('102', [Validators.required]),
    unit: new FormControl<Unit>(Unit.UN, [Validators.required]),
    origin: new FormControl<number>(0, [Validators.required, Validators.min(0), Validators.max(8)]),
    quantity: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    categoryId: new FormControl<number | null>(null),
    active: new FormControl<boolean>(true, [Validators.required]),
  });

  private currentComposition: ProductComposition | null = null;

  unitOptions = Object.values(Unit);

  productionLocationOptions: { code: string; name: string }[] = [];
  categories: Category[] = [];

  csosnOptions = [
    { value: '101', label: '101 - Tributada pelo SN com permissão de crédito' },
    { value: '102', label: '102 - Tributada pelo SN sem permissão de crédito' },
    { value: '103', label: '103 - Isenção do ICMS no SN para faixa de receita' },
    { value: '201', label: '201 - Tributada pelo SN com crédito e com ST' },
    { value: '202', label: '202 - Tributada pelo SN sem crédito e com ST' },
    { value: '203', label: '203 - Isenção do ICMS no SN e com ST' },
    { value: '300', label: '300 - Imune' },
    { value: '400', label: '400 - Não tributada pelo SN' },
    { value: '500', label: '500 - ICMS cobrado anteriormente por ST ou antecipação' },
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
    this.loadProductionLocations();
    this.getSugestionCode();
    this.loadCategories();
    this.setupProductTypeListener();
  }

  loadProductionLocations() {
    this.locationsService.getAll().subscribe({
      next: (locations) => {
        this.productionLocationOptions = locations.map((loc) => ({
          code: loc.code,
          name: loc.name,
        }));
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(
          `Erro ao carregar locais de produção: ${e.error?.message || e.message}`,
        );
      },
    });
  }

  loadCategories() {
    this.categoryService.getCategories(1, 100).subscribe({
      next: (res) => {
        this.categories = res.data;
        this.cdr.detectChanges();
      },
      error: (e) =>
        this.notification.error(`Erro ao carregar categorias: ${e.error?.message || e.message}`),
    });
  }

  private setupProductTypeListener(): void {
    const productTypeControl = this.formCreateProduct.get('productType');

    const initialValue = productTypeControl?.value ?? 'manufactured';
    this.updateCostPriceState(initialValue);
    this.updateProductionLocationState(initialValue);

    productTypeControl?.valueChanges.subscribe((type) => {
      const safeType = type ?? 'manufactured';
      this.updateCostPriceState(safeType);
      this.updateProductionLocationState(safeType);

      // Limpar composição apenas ao mudar para revenda
      if (safeType === 'resale' && this.compositionComponent) {
        this.compositionComponent.resetComposition();
        this.currentComposition = null;
      }
    });
  }

  private updateProductionLocationState(productType: string): void {
    const control = this.formCreateProduct.get('productionLocation');

    if (productType === 'manufactured' || productType === 'semi_manufactured') {
      control?.enable();
      control?.setValidators([Validators.required]);
    } else {
      control?.disable();
      control?.clearValidators();
      control?.setValue('');
    }
    control?.updateValueAndValidity();
  }

  private updateCostPriceState(productType: string): void {
    const costPriceControl = this.formCreateProduct.get('costPrice');

    if (productType === 'manufactured' || productType === 'semi_manufactured') {
      // Custo calculado automaticamente pela composição
      costPriceControl?.disable();
      costPriceControl?.setValue(this.currentComposition?.totalCost ?? 0);
    } else {
      // Revenda: custo manual
      costPriceControl?.enable();
    }
  }

  onCompositionChange(composition: ProductComposition): void {
    this.currentComposition = composition;

    if (this.hasComposition) {
      this.formCreateProduct.patchValue({ costPrice: composition.totalCost });
    }
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  get isManufacturedProduct(): boolean {
    return this.formCreateProduct.get('productType')?.value === 'manufactured';
  }

  get isSemiManufacturedProduct(): boolean {
    return this.formCreateProduct.get('productType')?.value === 'semi_manufactured';
  }

  get isResaleProduct(): boolean {
    return this.formCreateProduct.get('productType')?.value === 'resale';
  }

  /** Produtos que possuem composição (manufaturado ou semipronto) */
  get hasComposition(): boolean {
    return this.isManufacturedProduct || this.isSemiManufacturedProduct;
  }

  get productName(): string {
    return this.formCreateProduct.get('name')?.value ?? '';
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  onSubmit() {
    if (this.hasComposition) {
      if (!this.currentComposition || this.currentComposition.items.length === 0) {
        this.notification.error('Adicione ao menos um item à composição do produto');
        return;
      }

      if (!this.compositionComponent.isCompositionValid()) {
        this.notification.error('Preencha corretamente todos os campos da composição');
        this.compositionComponent.compositionForm.markAllAsTouched();
        return;
      }
    }

    if (!this.formCreateProduct.valid) {
      this.formCreateProduct.markAllAsTouched();
      this.notification.error('Preencha todos os campos obrigatórios do produto');
      return;
    }

    const formValue = this.formCreateProduct.getRawValue();

    const createProductDTO: CreateProductDTO = {
      name: formValue.name ?? '',
      code: formValue.code ?? '',
      productType: this.mapProductType(formValue.productType ?? 'resale'),
      productionLocation: this.hasComposition ? (formValue.productionLocation ?? '') : undefined,
      price: formValue.price ? parseFloat(formValue.price.toString()) : 0,
      costPrice: formValue.costPrice ? parseFloat(formValue.costPrice.toString()) : 0,
      extraCosts: formValue.extraCosts ? parseFloat(formValue.extraCosts.toString()) : 0,
      ncm: formValue.ncm?.length === 8 ? formValue.ncm : '00000000',
      cest: formValue.cest?.length === 7 ? formValue.cest : '0000000',
      csosn: formValue.csosn ?? '',
      unit: formValue.unit ?? Unit.UN,
      origin: formValue.origin ?? 0,
      categoryId: formValue.categoryId ?? undefined,
      quantity: formValue.quantity ? parseInt(formValue.quantity.toString(), 10) : 0,
      active: formValue.active ?? true,
      composition:
        this.hasComposition && this.currentComposition
          ? this.currentComposition.items.map((item) => ({
              materialId: item.materialId ? Number(item.materialId) : undefined,
              subProductId: item.subProductId ? Number(item.subProductId) : undefined,
              quantity: item.quantity,
              materialName: item.materialName,
              unitCost: item.unitCost,
            }))
          : undefined,
      preparationSteps:
        this.hasComposition && this.currentComposition
          ? this.currentComposition.preparationSteps.map((step, index) => ({
              order: index + 1,
              description: step.description,
            }))
          : undefined,
    };

    this.productService.create(createProductDTO).subscribe({
      next: (response) => {
        this.notification.success(`Produto ${response.name} criado com sucesso!`);
        this.resetForm();
      },
      error: (e) => {
        console.error('Erro ao criar produto:', e);
        this.notification.error(
          `Erro ao criar produto: ${e.error?.message ?? 'Erro desconhecido'}`,
        );
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private mapProductType(value: string): 'MANUFACTURED' | 'RESALE' | 'SEMI_MANUFACTURED' {
    const map: Record<string, 'MANUFACTURED' | 'RESALE' | 'SEMI_MANUFACTURED'> = {
      manufactured: 'MANUFACTURED',
      semi_manufactured: 'SEMI_MANUFACTURED',
      resale: 'RESALE',
    };
    return map[value] ?? 'RESALE';
  }

  getSugestionCode() {
    this.productService.getSuggestCode().subscribe({
      next: (response) => {
        this.formCreateProduct.patchValue({ code: response.code.toString() });
      },
      error: (e) => {
        this.notification.error(
          `Erro ao obter código sugerido: ${e.error?.message ?? 'Erro desconhecido'}`,
        );
      },
    });
  }

  calculateProfitMargin(): string {
    return this.calculateMargin('profit');
  }

  calculateMarkup(): string {
    return this.calculateMargin('markup');
  }

  calculateContributionMargin(): string {
    return this.calculateMargin('contribution');
  }

  private calculateMargin(type: 'profit' | 'markup' | 'contribution'): string {
    const price = this.formCreateProduct.get('price')?.value ?? 0;
    const costPrice = this.formCreateProduct.getRawValue().costPrice ?? 0;
    const extraCosts = this.formCreateProduct.get('extraCosts')?.value ?? 0;
    const totalCost = costPrice + extraCosts;

    if (type === 'contribution') {
      if (price === 0) return '0.00';
      return (((price - totalCost) / price) * 100).toFixed(2);
    }

    if (totalCost === 0) return '0.00';
    return (((price - totalCost) / totalCost) * 100).toFixed(2);
  }

  private resetForm(): void {
    this.formCreateProduct.reset({
      productType: 'manufactured',
      unit: Unit.UN,
      origin: 0,
      active: true,
      quantity: 0,
      price: 0,
      costPrice: 0,
      extraCosts: 0,
      csosn: '102',
    });

    this.currentComposition = null;

    if (this.compositionComponent) {
      this.compositionComponent.resetComposition();
    }

    this.getSugestionCode();
  }
}
