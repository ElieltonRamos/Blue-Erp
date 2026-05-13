import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { ModalUpdateBasicProduct } from '../modal-update-basic-product/modal-update-basic-product';
import { ModalUpdateMaterialsProduct } from '../modal-update-materials-product/modal-update-materials-product';
import { ModalUpdatePreparationProduct } from '../modal-update-preparation-product/modal-update-preparation-product';
import { ProductService } from '../../services/product.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FilterProductParams, Product, ProductType } from '../../types/product';

@Component({
  selector: 'app-list-products',
  imports: [
    CommonModule,
    FormsModule,
    PaginatorComponent,
    ModalUpdateBasicProduct,
    ModalUpdateMaterialsProduct,
    ModalUpdatePreparationProduct,
  ],
  templateUrl: './list-products.html',
})
export class ListProducts {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  listProducts: Product[] = [];
  page: number = 1;
  limit: number = 100;
  totalPages: number = 0;
  totalItems: number = 0;
  showModalBasic: boolean = false;
  showModalMaterials: boolean = false;
  showModalPreparation: boolean = false;
  editProduct: Product | null = null;

  searchTerm: string = '';
  filterActive: string = 'active';
  filterProductType: string = 'all';
  filterLowStock: boolean = false;

  sortKey: string = 'name';
  sortAsc: boolean = true;

  ngOnInit() {
    this.loadProducts();
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    this.page = 1;
    this.loadProducts();
  }

  onSearchChange() {
    this.page = 1;
    this.loadProducts();
  }

  onFilterChange() {
    this.page = 1;
    this.loadProducts();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterActive = 'active';
    this.filterProductType = 'all';
    this.filterLowStock = false;
    this.page = 1;
    this.loadProducts();
  }

  loadProducts() {
    const sortOrder = this.sortAsc ? 'asc' : 'desc';

    const filters: FilterProductParams = {};

    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }

    if (this.filterActive === 'active') {
      filters.active = true;
    } else if (this.filterActive === 'inactive') {
      filters.active = false;
    }

    if (this.filterProductType !== 'all') {
      filters.productType = this.filterProductType as ProductType;
    }

    if (this.filterLowStock) {
      filters.lowStock = true;
    }

    this.productService.getAll(this.page, this.limit, filters, this.sortKey, sortOrder).subscribe({
      next: (response) => {
        this.listProducts = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar produtos: ${e.error?.message || e.message}`);
      },
    });
  }

  toggleProductStatus(product: Product) {
    const action = product.active ? 'inativar' : 'ativar';
    const actionPast = product.active ? 'inativado' : 'ativado';

    alertConfirm(`Deseja ${action} o produto "${product.name}"?`).then((result) => {
      if (result) {
        this.productService.update(product.id, { active: !product.active }).subscribe({
          next: () => {
            this.notification.success(`Produto ${actionPast} com sucesso!`);
            this.loadProducts();
          },
          error: (e) => {
            this.notification.error(`Erro ao atualizar produto: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  deleteProduct(product: Product) {
    alertConfirm(`Deseja realmente deletar o produto "${product.name}"?`).then((result) => {
      if (result) {
        this.productService.delete(product.id).subscribe({
          next: () => {
            this.notification.success('Produto deletado com sucesso!');
            this.loadProducts();
          },
          error: (e) => {
            this.notification.error(`Erro ao deletar produto: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  closeModalBasic() {
    this.showModalBasic = false;
    this.editProduct = null;
    this.loadProducts();
  }

  closeModalMaterials() {
    this.showModalMaterials = false;
    this.editProduct = null;
    this.loadProducts();
  }

  closeModalPreparation() {
    this.showModalPreparation = false;
    this.editProduct = null;
    this.loadProducts();
  }

  openModalBasic(product: Product) {
    this.editProduct = product;
    this.showModalBasic = true;
  }

  openModalMaterials(product: Product) {
    this.editProduct = product;
    this.showModalMaterials = true;
  }

  openModalPreparation(product: Product) {
    this.editProduct = product;
    this.showModalPreparation = true;
  }

  hasComposition(productType: ProductType | string): boolean {
    return productType === 'MANUFACTURED' || productType === 'SEMI_MANUFACTURED';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  calculateProfitMargin(product: Product): number {
    const totalCost = product.costPrice + (product.extraCosts || 0);
    if (totalCost === 0) return 0;
    return ((product.price - totalCost) / totalCost) * 100;
  }

  getStockStatusClass(product: Product): string {
    if (product.quantity === 0) return 'bg-red-500/20 text-red-400 border border-red-500/50';
    if (product.minStock && product.quantity <= product.minStock) {
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    }
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  }

  getStockStatusText(product: Product): string {
    if (product.quantity === 0) return 'Sem Estoque';
    if (product.minStock && product.quantity <= product.minStock) return 'Baixo';
    return 'Normal';
  }

  getProductTypeBadge(productType: ProductType | string): string {
    switch (productType) {
      case 'MANUFACTURED':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
      case 'SEMI_MANUFACTURED':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
      default:
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/50';
    }
  }

  getProductTypeText(productType: ProductType | string): string {
    switch (productType) {
      case 'MANUFACTURED':
        return 'Manufaturado';
      case 'SEMI_MANUFACTURED':
        return 'Semipronto';
      default:
        return 'Revenda';
    }
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.loadProducts();
  }
}
