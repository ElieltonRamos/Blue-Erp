import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import Expense, { ExpenseFilters } from '../../types/Expense';
import { FinancialService } from '../../services/financial.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-list-expenses',
  imports: [FormsModule, PaginatorComponent, CommonModule, ModalEditEntity],
  templateUrl: './list-expenses.html',
})
export class ListExpenses {
  private notification = inject(NotificationService);
  private financialService = inject(FinancialService);
  private cdr = inject(ChangeDetectorRef);

  listExpenses: Expense[] = [];
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  showModalEdit: boolean = false;
  sortKey: keyof Expense = 'id';
  sortAsc: boolean = true;
  editExpense: Expense = {
    id: 0,
    supplier: '',
    description: '',
    value: 0,
    datePayment: '',
    status: 'Pendente',
  };
  filter: ExpenseFilters = {
    supplier: '',
    status: '',
    startDate: '',
    endDate: '',
  };
  searchTerm: string = '';
  sortOption: string = '';

  expenseFields: FormField[] = [
    { name: 'supplier', label: 'Fornecedor', type: 'text' },
    { name: 'description', label: 'Descrição', type: 'text' },
    { name: 'value', label: 'Valor', type: 'number' },
    { name: 'datePayment', label: 'Data Vencimento', type: 'date' }
  ];

  ngOnInit() {
    this.getAllExpenses(this.page, this.limit);
  }

  applyFilters() {
    this.getAllExpenses(this.page, this.limit);
  }

  clearFilters() {
    this.filter = {
      supplier: '',
      status: '',
      startDate: '',
      endDate: '',
    };
    this.applyFilters();
  }

  sortBy(key: keyof Expense) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }
    this.getAllExpenses(this.page, this.limit);
  }

  getAllExpenses(page: number, limit: number) {
    const sortOrder = this.sortAsc ? 'asc' : 'desc';

    this.financialService
      .getAllExpenses(page, limit, this.filter, this.sortKey, sortOrder)
      .subscribe({
        next: (response) => {
          this.listExpenses = response.data;
          this.totalItems = response.total;
          this.page = response.page;
          this.limit = response.limit;
          this.totalPages = response.totalPages;
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.notification.error(`Erro ao carregar despesas: ${e.error.message}`);
        },
      });
  }

  deleteExpense(expense: Expense) {
    alertConfirm('Excluir Despesa?').then((result) => {
      if (result) {
        this.financialService.deleteExpense(expense.id!).subscribe({
          next: () => {
            this.notification.success('Despesa excluida com sucesso');
            this.getAllExpenses(this.page, this.limit);
          },
          error: (e) => {
            this.notification.error(`Error ao excluir Despesa: ${e.error.message}`);
          },
        });
      }
    });
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getAllExpenses(this.page, this.limit);
  }

  markAsPaid(expense: Expense): void {
    expense.status = 'Pago';
    this.financialService.updateExpense(expense).subscribe({
      next: () => {
        this.notification.success('Despesa marcada como paga');
        this.getAllExpenses(this.page, this.limit);
      },
      error: (e) => {
        this.notification.error(`Erro ao marcar despesa como paga: ${e.error.message}`);
      },
    });
  }

  openModalEdit(expense: Expense) {
    this.editExpense = expense;
    this.showModalEdit = true;
  }

  onSave(expense: Expense) {
    this.financialService.updateExpense(expense).subscribe({
      next: (_res) => {
        this.notification.success('Despesa Atualizado com sucesso');
        this.closeModalEdit()
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar o despesa: ${e.error.message}`);
      },
    });
  }
}
