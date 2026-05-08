import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CreateProduct } from '../components/create-product/create-product';
import { ListProducts } from '../components/list-products/list-products';
import { CreatePrimaryMaterial } from '../components/primary-material/create-primary-material';
import { ListPrimaryMaterial } from '../components/list-primary-material/list-primary-material';
import { CategoryComponent } from '../components/category/category';

@Component({
  selector: 'app-products',
  imports: [
    CreateProduct,
    ListProducts,
    CreatePrimaryMaterial,
    ListPrimaryMaterial,
    CategoryComponent,
  ],
  templateUrl: './products.html',
})
export class Products {
  private router = inject(Router);
  menuContext = 'listProducts';
  classBtnSelected =
    'bg-accent hover:bg-[var(--color-accent-hover)] text-[var(--color-btn-text)] px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md';

  classBtnUnselected =
    'bg-surface-alt hover:bg-overlay text-text-primary px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all border border-border';
  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
