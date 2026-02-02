import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { SalesService } from '../../services/sales.service';
import { ModalSalesNote } from '../../components/modal-sales-note/modal-sales-note';
import { Sale } from '../../types/sale';
import User from '../../../users/types/user';

@Component({
  selector: 'app-sales-history',
  imports: [FormsModule, ModalSalesNote, PaginatorComponent],
  templateUrl: './sales-history.html',
})
export class SalesHistory {
  totalItems = 0;
  limit = 10;
  page = 1;
  totalPages = 0;
  listSales: Sale[] = [];
  showSaleModal = false;
  saleSelected: Sale | null = null;

  startDate: string | null = null;
  endDate: string | null = null;
  filterId: string = '';
  filterClient: string = '';
  filterOperator: string = '';
  filterMethod: string = '';
  operators: User[] = [];

  private router = inject(Router);
  private userService = inject(UserService);
  private salesService = inject(SalesService);
  private notification = inject(NotificationService);

  ngOnInit() {
    this.getOperators();

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const localDate = now.toISOString().split('T')[0];
    this.startDate = localDate;
    this.endDate = localDate;

    this.getSales(this.page, this.limit);
  }

  getOperators() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.operators = response;
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar operadores: ${e.error?.message || 'Erro inesperado.'}`);
      },
    });
  }

  applyDateFilter(): void {
    this.page = 1; // Reinicia para a primeira página
    this.getSales(this.page, this.limit);
  }

  clearDateFilter(): void {
    this.startDate = null;
    this.endDate = null;
    this.filterId = '';
    this.filterClient = '';
    this.filterOperator = '';
    this.filterMethod = '';
    this.page = 1;
    this.getSales(this.page, this.limit);
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  getSales(page: number, limit: number): void {
    const filters: any = {
      id: this.filterId?.trim() || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      client: this.filterClient?.trim() || undefined,
      operator: this.filterOperator?.trim() || undefined,
      paymentMethod: this.filterMethod?.trim() || undefined,
    };

    this.salesService.getSales(page, limit, filters).subscribe({
      next: (response) => {
        this.listSales = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
      },
      error: (e: any) => {
        this.notification.error(`Erro ao buscar vendas: ${e.error?.message || 'Erro inesperado.'}`);
      },
    });
  }

  closeSaleModal() {
    this.saleSelected = null;
    this.showSaleModal = false;
  }

  openSaleModal(sale: Sale) {
    this.saleSelected = sale;
    this.showSaleModal = true;
  }
}
