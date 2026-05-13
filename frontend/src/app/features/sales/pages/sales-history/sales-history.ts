import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../users/services/user.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { ModalSalesNote } from '../../components/modal-sales-note/modal-sales-note';
import { FiscalStatus, Sale, SaleFilters } from '../../types/sale';
import User from '../../../users/types/user';
import { SaleService } from '../../services/sales.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-sales-history',
  imports: [FormsModule, ModalSalesNote, PaginatorComponent, DatePipe],
  templateUrl: './sales-history.html',
})
export class SalesHistory {
  totalItems = 0;
  limit = 100;
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
  filterFiscalStatus: FiscalStatus | null = null;
  filterIsPaid: boolean | null = null;
  operators: User[] = [];

  fiscalStatusOptions = Object.values(FiscalStatus);

  private router = inject(Router);
  private userService = inject(UserService);
  private salesService = inject(SaleService);
  private notification = inject(NotificationService);

  ngOnInit() {
    this.getOperators();
    this.setTodayDate();
    this.getSales(this.page, this.limit);
  }

  getOperators() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.operators = response;
      },
      error: (e) => {
        this.notification.error(
          `Erro ao buscar operadores: ${e.error?.message || 'Erro inesperado.'}`,
        );
      },
    });
  }

  applyDateFilter(): void {
    this.page = 1;
    this.getSales(this.page, this.limit);
  }

  private setTodayDate(): void {
    const now = new Date();
    const brasiliaOffset = -3;
    const brasiliaTime = new Date(now.getTime() + brasiliaOffset * 60 * 60 * 1000);

    brasiliaTime.setHours(0, 0, 0, 0);
    const localDate = brasiliaTime.toISOString().split('T')[0];

    this.startDate = localDate;
    this.endDate = localDate;
  }

  clearDateFilter(): void {
    this.setTodayDate();
    this.filterId = '';
    this.filterClient = '';
    this.filterOperator = '';
    this.filterMethod = '';
    this.filterFiscalStatus = null;
    this.filterIsPaid = null;
    this.page = 1;
    this.getSales(this.page, this.limit);
  }

  goToMenu() {
    this.router.navigate(['/dashboard']);
  }

  getSales(page: number, limit: number): void {
    const filters: SaleFilters = {
      page,
      limit,
      ...(this.filterId?.trim() && { clientId: Number(this.filterId) }),
      ...(this.startDate && { startDate: this.startDate }),
      ...(this.endDate && { endDate: this.endDate }),
      ...(this.filterOperator?.trim() && { operatorId: Number(this.filterOperator) }),
      ...(this.filterMethod?.trim() && { paymentMethod: this.filterMethod }),
      ...(this.filterFiscalStatus && { fiscalStatus: this.filterFiscalStatus }),
      ...(this.filterIsPaid !== null && { isPaid: this.filterIsPaid }),
    };

    this.salesService.getSales(filters).subscribe({
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

  markAsReceived(salesIds: number[]): void {
    this.salesService.markAsReceived({ salesIds }).subscribe({
      next: (response) => {
        this.notification.success(response.message);
        this.getSales(this.page, this.limit);
      },
      error: (e: any) => {
        this.notification.error(`Erro ao marcar vendas: ${e.error?.message || 'Erro inesperado.'}`);
      },
    });
  }
}
