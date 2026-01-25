import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { ModalSalesNote } from '../../../sales/components/modal-sales-note/modal-sales-note';
import { Sale } from '../../../sales/types/sale';
import User from '../../../login/types/auth';
import { FinancialService } from '../../services/financial.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-promissory-note-receivable',
  imports: [PaginatorComponent, ModalSalesNote, FormsModule, CommonModule],
  templateUrl: './promissory-note-receivable.html',
})
export class PromissoryNoteReceivable {
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
  filterMethod: string = 'Notinha';
  filterIsPaid: boolean | undefined = false;
  filterStatusSelect: 'pending' | 'all' = 'pending';
  operators: User[] = [];
  selectedSalesIds: number[] = [];

  private router = inject(Router);
  private financialService = inject(FinancialService);
  private notification = inject(NotificationService);

  get totalSelectedAmount(): number {
    const selected = this.listSales.filter((sale) => this.selectedSalesIds.includes(sale.id!));
    return selected.reduce((acc, sale) => acc + Number(sale.total), 0);
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'pending') {
      this.filterIsPaid = false;
    } else if (value === 'all') {
      this.filterIsPaid = undefined;
    }

    this.page = 1;
    this.getSales(this.page, this.limit);
  }

  toggleSelectAllEvent(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleSelectAll(checked);
  }

  isSelected(id: number): boolean {
    return this.selectedSalesIds.includes(id);
  }

  toggleSelection(id: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedSalesIds.includes(id)) {
        this.selectedSalesIds.push(id);
      }
    } else {
      this.selectedSalesIds = this.selectedSalesIds.filter((saleId) => saleId !== id);
    }
  }

  onCheckboxChange(event: Event, id: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleSelection(id, checked);
  }

  get allSelected(): boolean {
    return this.listSales.length > 0 && this.selectedSalesIds.length === this.listSales.length;
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedSalesIds = this.listSales.map((sale) => sale.id!);
    } else {
      this.selectedSalesIds = [];
    }
  }

  markSelectedAsReceived(): void {
    this.financialService.markSaleReceived(this.selectedSalesIds).subscribe({
      next: () => {
        this.notification.success('Baixa de notinhas realizada com sucesso!');
        this.selectedSalesIds = [];
        this.getSales(this.page, this.limit);
      },
      error: (e) => {
        this.notification.error(
          `Erro ao marcar vendas como recebidas: ${e.error?.message || 'Erro inesperado.'}`,
        );
      },
    });
  }

  formatNumber(n: any): number {
    const num = Number(n);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
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
    this.filterMethod = 'Notinha';
    this.filterIsPaid = false;
    this.filterStatusSelect = 'pending';
    this.page = 1;
    this.getSales(this.page, this.limit);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }
  getSales(page: number, limit: number): void {
    const filters: any = {
      id: this.filterId?.trim() || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      client: this.filterClient?.trim() || undefined,
      operator: this.filterOperator?.trim() || undefined,
      paymentMethod: this.filterMethod?.trim() || undefined,
      isPaid: this.filterIsPaid,
    };

    this.financialService.getSales(page, limit, filters).subscribe({
      next: (response) => {
        this.listSales = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
      },
      error: (e) => {
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
