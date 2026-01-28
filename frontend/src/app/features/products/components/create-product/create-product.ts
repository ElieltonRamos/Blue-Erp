import { Component, inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import Product, { CreateProductDTO, ProductComposition, Unit } from '../../types/product';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ProductCompositionComponent } from '../product-composition/product-composition';

@Component({
  selector: 'app-create-product',
  imports: [ReactiveFormsModule, CommonModule, ProductCompositionComponent],
  templateUrl: './create-product.html',
})
export class CreateProduct {
  @ViewChild(ProductCompositionComponent) compositionComponent!: ProductCompositionComponent;

  private notification = inject(NotificationService);
  private productService = inject(ProductService);

  formCreateProduct = new FormGroup({
    name: new FormControl('', [Validators.required]),
    code: new FormControl('', [Validators.required]),
    productType: new FormControl('manufactured', [Validators.required]), // 'manufactured' ou 'resale'
    price: new FormControl(0, [Validators.required, Validators.min(0.01)]),
    costPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
    ncm: new FormControl('', [Validators.pattern(/^\d{8}$/)]),
    cest: new FormControl('', [Validators.pattern(/^\d{7}$/)]),
    csosn: new FormControl('102', [Validators.required]),
    unit: new FormControl(Unit.UN, [Validators.required]),
    origin: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(8)]),
    quantity: new FormControl(0, [Validators.required, Validators.min(0)]),
    active: new FormControl(true, [Validators.required]),
  });

  // Armazenar a composição atual
  private currentComposition: ProductComposition | null = null;

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
    this.setupProductTypeListener();
  }

  /**
   * Configura listener para mudanças no tipo de produto
   */
  private setupProductTypeListener(): void {
    const productTypeControl = this.formCreateProduct.get('productType');

    // Configuração inicial
    const initialValue = productTypeControl?.value ?? 'manufactured';
    this.updateCostPriceState(initialValue);

    // Listener para mudanças
    productTypeControl?.valueChanges.subscribe((type) => {
      const safeType = type ?? 'manufactured';
      this.updateCostPriceState(safeType);

      // Limpar composição se mudar para revenda
      if (safeType === 'resale' && this.compositionComponent) {
        this.compositionComponent.resetComposition();
        this.currentComposition = null;
      }
    });
  }

  /**
   * Atualiza estado do campo costPrice baseado no tipo de produto
   */
  private updateCostPriceState(productType: string): void {
    const costPriceControl = this.formCreateProduct.get('costPrice');

    if (productType === 'manufactured') {
      // Produto manufaturado: custo calculado automaticamente
      costPriceControl?.disable();
      costPriceControl?.setValue(this.currentComposition?.totalCost || 0);
    } else {
      // Produto de revenda: custo manual
      costPriceControl?.enable();
    }
  }

  /**
   * Atualiza o custo do produto quando a composição muda
   */
  onCompositionChange(composition: ProductComposition): void {
    this.currentComposition = composition;

    // Atualizar o campo de custo com o total da composição (apenas para produtos manufaturados)
    if (this.isManufacturedProduct) {
      const totalCost = composition.totalCost;
      this.formCreateProduct.patchValue({
        costPrice: totalCost,
      });

      console.log('Composição atualizada:', {
        totalItems: composition.items.length,
        totalSteps: composition.preparationSteps.length,
        totalCost: totalCost,
      });
    }
  }

  /**
   * Verifica se o produto é manufaturado
   */
  get isManufacturedProduct(): boolean {
    return this.formCreateProduct.get('productType')?.value === 'manufactured';
  }

  /**
   * Verifica se o produto é de revenda
   */
  get isResaleProduct(): boolean {
    return this.formCreateProduct.get('productType')?.value === 'resale';
  }

  /**
   * Submete o formulário para criar o produto
   */
  onSubmit() {
    // Validar composição apenas para produtos manufaturados
    if (this.isManufacturedProduct) {
      if (!this.currentComposition || this.currentComposition.items.length === 0) {
        this.notification.error('Adicione ao menos uma matéria-prima à composição do produto');
        return;
      }

      // Validar se a composição está válida
      if (!this.compositionComponent.isCompositionValid()) {
        this.notification.error('Preencha corretamente todos os campos da composição');
        this.compositionComponent.compositionForm.markAllAsTouched();
        return;
      }
    }

    // Validar o formulário principal
    if (!this.formCreateProduct.valid) {
      this.formCreateProduct.markAllAsTouched();
      this.notification.error('Preencha todos os campos obrigatórios do produto');
      return;
    }

    const formValue = this.formCreateProduct.getRawValue(); // getRawValue() pega valores disabled também

    // Preparar DTO para envio ao backend
    const createProductDTO: CreateProductDTO = {
      name: formValue.name || '',
      code: formValue.code || '',
      productType: formValue.productType || 'manufactured',
      price: formValue.price ? parseFloat(formValue.price.toString()) : 0,
      costPrice: formValue.costPrice ? parseFloat(formValue.costPrice.toString()) : 0,
      ncm: formValue.ncm || '',
      cest: formValue.cest || '',
      csosn: formValue.csosn || '',
      unit: formValue.unit || Unit.UN,
      origin: formValue.origin ?? 0,
      quantity: formValue.quantity ? parseInt(formValue.quantity.toString(), 10) : 0,
      active: formValue.active ?? true,
      // Incluir composição apenas para produtos manufaturados
      composition: this.isManufacturedProduct
        ? this.compositionComponent.getCompositionDTO()
        : undefined,
    };

    console.log('Enviando produto para o backend:', createProductDTO);

    // Chamar o serviço para criar o produto
    this.productService.createProductWithComposition(createProductDTO).subscribe({
      next: (response) => {
        this.notification.success(`Produto ${response.name} criado com sucesso!`);
        this.resetForm();
      },
      error: (e) => {
        console.error('Erro ao criar produto:', e);
        this.notification.error(
          `Erro ao criar produto: ${e.error?.message || 'Erro desconhecido'}`,
        );
      },
    });
  }

  /**
   * Obtém sugestão de código do produto
   */
  getSugestionCode() {
    this.productService.getSugestionCode().subscribe({
      next: (response) => {
        this.formCreateProduct.patchValue({ code: response.code.toString() });
      },
      error: (e) => {
        this.notification.error(
          `Erro ao obter código sugerido: ${e.error?.message || 'Erro desconhecido'}`,
        );
      },
    });
  }

  /**
   * Calcula a margem de lucro
   */
  calculateProfitMargin(): string {
    const price = this.formCreateProduct.get('price')?.value || 0;
    const costPrice = this.formCreateProduct.getRawValue().costPrice || 0;

    if (costPrice === 0) return '0.00';

    const margin = ((price - costPrice) / costPrice) * 100;
    return margin.toFixed(2);
  }

  /**
   * Obtém o nome do produto para passar ao componente de composição
   */
  get productName(): string {
    return this.formCreateProduct.get('name')?.value || '';
  }

  /**
   * Reseta o formulário e a composição
   */
  private resetForm(): void {
    this.formCreateProduct.reset({
      productType: 'manufactured',
      unit: Unit.UN,
      origin: 0,
      active: true,
      quantity: 0,
      price: 0,
      costPrice: 0,
      csosn: '102',
    });

    this.currentComposition = null;

    if (this.compositionComponent) {
      this.compositionComponent.resetComposition();
    }

    this.getSugestionCode();
  }

  /**
   * Calcula markup (percentual de lucro sobre o custo)
   */
  calculateMarkup(): string {
    const price = this.formCreateProduct.get('price')?.value || 0;
    const costPrice = this.formCreateProduct.getRawValue().costPrice || 0;

    if (costPrice === 0) return '0.00';

    const markup = ((price - costPrice) / costPrice) * 100;
    return markup.toFixed(2);
  }

  /**
   * Calcula margem de contribuição (percentual de lucro sobre o preço)
   */
  calculateContributionMargin(): string {
    const price = this.formCreateProduct.get('price')?.value || 0;
    const costPrice = this.formCreateProduct.getRawValue().costPrice || 0;

    if (price === 0) return '0.00';

    const margin = ((price - costPrice) / price) * 100;
    return margin.toFixed(2);
  }
}
