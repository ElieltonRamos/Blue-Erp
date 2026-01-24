import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import Product, { Unit } from '../../types/product';
import { ModalUpdateProduct } from '../modal-update-product/modal-update-product';
import { ProductService } from '../../services/product.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-list-products',
  imports: [CommonModule, FormsModule, PaginatorComponent, ModalUpdateProduct],
  templateUrl: './list-products.html',
})
export class ListProducts {
  private notification = inject(NotificationService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef)

  listProducts: Product[] = [];
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  showModalEdit: boolean = false;
  editProduct: Product = {
    name: '',
    price: 0,
    quantity: 0,
    code: '0',
    costPrice: 0,
    active: true,
    cest: '0',
    csosn: '102',
    ncm: '00000000',
    origin: 0,
    unit: Unit.UN,
    id: 0,
  };
  searchTerm: string = '';
  searchCode: string = '';
  filterActive: string = 'active';

  // Propriedades de ordenação
  sortKey: string = 'id';
  sortAsc: boolean = true;

  ngOnInit() {
    this.getAllProducts(this.page, this.limit);
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    // Resetar para primeira página ao ordenar
    this.page = 1;
    this.getAllProducts(this.page, this.limit);
  }

  // Busca automática por nome (em tempo real)
  onSearchName() {
    if (this.searchTerm !== '') {
      this.getProductByName();
    } else {
      this.getAllProducts(1, 20);
    }
  }

  // Busca por código apenas ao pressionar Enter
  onSearchCodeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.searchByCode();
    }
  }

  searchByCode() {
    if (this.searchCode !== '') {
      this.getProductByCode();
    } else {
      this.getAllProducts(1, 20);
    }
  }

  getProductByName() {
    this.productService.getProductByName(this.searchTerm).subscribe({
      next: (response) => {
        this.listProducts = this.applyActiveFilter(response);
        this.totalItems = this.listProducts.length;
        this.page = 1;
        this.limit = this.listProducts.length || 20;
        this.totalPages = 1;
        this.cdr.detectChanges(); 
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar produtos: ${e.error?.message || e.message}`);
      },
    });
  }

  getProductByCode() {
    this.productService.getProductByCode(this.searchCode).subscribe({
      next: (response) => {
        // getProductByCode retorna um único produto, então criamos um array
        this.listProducts = this.applyActiveFilter([response]);
        this.totalItems = this.listProducts.length;
        this.page = 1;
        this.limit = 1;
        this.totalPages = 1;
        this.cdr.detectChanges(); 
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar produto: ${e.error?.message || e.message}`);
        this.listProducts = [];
        this.totalItems = 0;
      },
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchCode = '';
    this.getAllProducts(1, 20);
  }

  applyActiveFilter(products: Product[]): Product[] {
    if (this.filterActive === 'active') {
      return products.filter((p) => p.active === true);
    } else if (this.filterActive === 'inactive') {
      return products.filter((p) => p.active === false);
    }
    return products;
  }

  onFilterActiveChange() {
    this.page = 1;
    this.getAllProducts(this.page, this.limit);
  }

  getAllProducts(page: number, limit: number) {
    const sortOrder = this.sortAsc ? 'asc' : 'desc';

    this.productService.getAllProducts(page, limit, this.sortKey, sortOrder).subscribe({
      next: (response) => {
        this.listProducts = this.applyActiveFilter(response.data);
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
        const updatedProduct = { ...product, active: !product.active };

        this.productService.updateProduct(updatedProduct).subscribe({
          next: () => {
            this.notification.success(`Produto ${actionPast} com sucesso!`);
            this.getAllProducts(this.page, this.limit);
          },
          error: (e) => {
            this.notification.error(`Erro ao buscar produtos: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getAllProducts(this.page, this.limit);
  }

  openModalEdit(product: Product) {
    this.editProduct = product;
    this.showModalEdit = true;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  calculateProfitMargin(product: Product): number {
    if (product.costPrice === 0) return 0;
    return ((product.price - product.costPrice) / product.costPrice) * 100;
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-500/20 text-red-400 border border-red-500/50';
    if (quantity <= 10) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    return 'bg-green-500/20 text-green-400 border border-green-500/50';
  }

  getStockStatusText(quantity: number): string {
    if (quantity === 0) return 'Sem Estoque';
    if (quantity <= 10) return 'Baixo';
    return 'Normal';
  }
}
