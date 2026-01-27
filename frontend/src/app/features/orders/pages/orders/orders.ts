// orders-listing.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateOrder } from "../../components/create-order/create-order";
import { ListOrders } from "../../components/list-orders/list-orders";

@Component({
  selector: 'app-orders-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateOrder, ListOrders],
  templateUrl: './orders.html',
})
export class Orders {
  private router = inject(Router);
  menuContext = 'list-orders';
  classBtnSelected =
    'bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';
  classBtnUnselected =
    'text-white hover:underline px-4 py-2 rounded-lg flex items-center gap-2 font-semibold';

  changeMenuContext(context: string): void {
    this.menuContext = context;
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }
}
