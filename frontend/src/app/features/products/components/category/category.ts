import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import Category from '../../types/category';

@Component({
  selector: 'app-category',
  imports: [ReactiveFormsModule, FormsModule, PaginatorComponent, ModalEditEntity],
  templateUrl: './category.html',
})
export class CategoryComponent {
  private categoryService = inject(CategoryService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  // Lista
  listCategories: Category[] = [];
  page = 1;
  limit = 20;
  totalPages = 0;
  totalItems = 0;
  filterSearch = '';
  filterStatus = 'all';

  // Modal
  showModalEdit = false;
  editCategory: Category = { name: '', active: true };
  categoryFields: FormField[] = [
    { name: 'name', label: 'Nome', type: 'text' },
    { name: 'active', label: 'Status', type: 'select', options: ['Ativo', 'Inativo'] },
  ];

  // Form
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  ngOnInit() {
    this.getCategories(this.page, this.limit);
  }

  getCategories(page: number, limit: number) {
    this.categoryService
      .getCategories(page, limit, this.filterSearch, this.filterStatus)
      .subscribe({
        next: (res) => {
          this.listCategories = res.data;
          this.totalItems = res.total;
          this.page = res.page;
          this.limit = res.limit;
          this.totalPages = res.totalPages;
          this.cdr.detectChanges();
        },
        error: (e) =>
          this.notification.error(`Erro ao buscar categorias: ${e.error?.message || e.message}`),
      });
  }

  applyFilters() {
    this.page = 1;
    this.getCategories(this.page, this.limit);
  }

  clearFilters() {
    this.filterSearch = '';
    this.filterStatus = 'all';
    this.page = 1;
    this.getCategories(this.page, this.limit);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.categoryService.createCategory({ name: this.form.value.name!, active: true }).subscribe({
      next: (res) => {
        this.notification.success(`Categoria "${res.name}" criada com sucesso!`);
        this.form.reset();
        this.getCategories(this.page, this.limit);
      },
      error: (e) =>
        this.notification.error(`Erro ao criar categoria: ${e.error?.message || e.message}`),
    });
  }

  openModalEdit(category: Category) {
    this.editCategory = category;
    this.showModalEdit = true;
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getCategories(this.page, this.limit);
  }

  onSaveModal(category: Category) {
    this.categoryService.updateCategory(category.id!, category).subscribe({
      next: () => {
        this.notification.success('Categoria editada com sucesso');
        this.closeModalEdit();
      },
      error: (e) =>
        this.notification.error(`Erro ao editar categoria: ${e.error?.message || e.message}`),
    });
  }

  deleteCategory(category: Category) {
    alertConfirm('Excluir Categoria?').then((result) => {
      if (result) {
        this.categoryService.deleteCategory(category.id!).subscribe({
          next: () => {
            this.notification.success('Categoria excluída com sucesso');
            this.getCategories(this.page, this.limit);
          },
          error: (e) =>
            this.notification.error(`Erro ao deletar categoria: ${e.error?.message || e.message}`),
        });
      }
    });
  }
}
