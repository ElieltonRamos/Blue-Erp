// purchase-module.ts (shell)
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseList } from '../components/purchase-list/purchase-list';
import { BusinessPartners } from '../components/business-partners/business-partners';

@Component({
  selector: 'app-purchase-module',
  imports: [PurchaseList, BusinessPartners],
  templateUrl: './purchases.html',
})
export class PurchaseModuleComponent {
  private router = inject(Router);
  menuContext = 'listPurchases';

  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
