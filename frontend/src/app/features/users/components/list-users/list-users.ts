import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { alertConfirm, alertError } from '../../../../shared/alerts/custom-alerts';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import User from '../../types/user';

@Component({
  selector: 'app-list-users',
  imports: [ModalEditEntity, FormsModule, CommonModule],
  templateUrl: './list-users.html',
})
export class ListUsers {
  private notification = inject(NotificationService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  listUsers: User[] = [];
  showModalEdit: boolean = false;
  editUser: User = { id: 1, password: '', username: '', role: '', workplace: '' };

  filters = {
    username: '',
    role: '',
    workplace: '',
    active: '',
  };

  userFields: FormField[] = [
    { name: 'username', label: 'Nome', type: 'text' },
    { name: 'password', label: 'Senha', type: 'password' },
    {
      name: 'role',
      label: 'Tipo de usuario',
      type: 'select',
      options: ['admin', 'caixa', 'garcom'],
    },
    { name: 'workplace', label: 'Local de Trabalho', type: 'text' },
    { name: 'active', label: 'Status', type: 'select', options: ['Ativo', 'Inativo'] },
  ];

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    this.userService.getUsers(this.filters).subscribe({
      next: (response) => {
        this.listUsers = response;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar usuarios: ${e.error?.message || e.message}`);
      },
    });
  }

  applyFilters() {
    this.getUsers();
  }

  deleteUser(user: User) {
    alertConfirm('Excluir Usuario').then((result) => {
      if (result) {
        this.userService.deleteUser(user.id!).subscribe({
          next: (res) => {
            this.notification.success('Usuario Deletado');
            this.getUsers();
          },
          error: (e) => {
            this.notification.error(`Erro ao deletar usuario: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getUsers();
  }

  openModalEdit(user: User) {
    this.editUser = { ...user };
    this.showModalEdit = true;
  }

  onSave(user: User) {
    if (user.username === '' || user.password === '') {
      alertError('Preencha todos os campos!');
      return;
    }
    this.userService.editUser(user.id!, user).subscribe({
      next: (_res) => {
        this.notification.success('Usuario Atualizado com Sucesso!');
        this.closeModalEdit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar usuario: ${e.error?.message || e.message}`);
      },
    });
  }
}
