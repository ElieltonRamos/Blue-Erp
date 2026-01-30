import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import Client from '../../types/clients';
import { ClientService } from '../../services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { ClientMockService } from '../../services/client.mock.service';

@Component({
  selector: 'app-list-clients',
  imports: [PaginatorComponent, ModalEditEntity],
  templateUrl: './list-clients.html',
})
export class ListClients {
  private clientService = inject(ClientMockService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef)
  listClients: Client[] = [];
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;
  showModalEdit: boolean = false;
  editClient: Client = { name: '', phone: '', address: '', cpf: '' };

  clientFields: FormField[] = [
    { name: 'name', label: 'Nome', type: 'text' },
    { name: 'phone', label: 'Telefone', type: 'number' },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'cpf', label: 'CPF', type: 'number' },
  ];

  ngOnInit() {
    this.getClients(this.page, this.limit);
  }

  getClients(page: number, limit: number) {
    this.clientService.getClients(page, limit).subscribe({
      next: (response) => {
        this.listClients = response.data;
        this.totalItems = response.total;
        this.page = response.page;
        this.limit = response.limit;
        this.totalPages = response.totalPages;
        this.cdr.detectChanges(); 
      },
      error: (e) => {
        this.notification.error(`Erro ao buscar clientes: ${e.error?.message || e.message}`);
      },
    });
  }

  deleteClient(client: Client) {
    alertConfirm('Excluir Cliente?').then((result) => {
      if (result) {
        this.clientService.deleteClient(client.id!).subscribe({
          next: () => {
            this.notification.success('Cliente excluido com sucesso');
            this.getClients(this.page, this.limit);
          },
          error: (e) => {
            this.notification.error(`Erro ao deletar cliente: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.getClients(this.page, this.limit);
  }

  openModalEdit(client: Client) {
    this.editClient = client;
    this.showModalEdit = true;
  }

  onSaveModal(client: Client) {
    this.clientService.updateClient(client.id!!, client).subscribe({
      next: (_res) => {
        this.notification.success('Cliente Editado com sucesso');
        this.closeModalEdit();
      },
      error: (e) => {
        this.notification.error(`Erro ao editar cliente: ${e.error?.message || e.message}`);
      },
    });
  }
}
