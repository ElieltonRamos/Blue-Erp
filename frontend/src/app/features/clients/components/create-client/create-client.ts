import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ClientService } from '../../services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import Client from '../../types/clients';

@Component({
  selector: 'app-create-client',
  imports: [ReactiveFormsModule, NgxMaskDirective],
  templateUrl: './create-client.html',
  providers: [provideNgxMask()],
})
export class CreateClient {
  private clientService = inject(ClientService);
  private notification = inject(NotificationService);

  @Output() created = new EventEmitter<Client>();
  @Output() cancelled = new EventEmitter<void>();

  creating = false;

  formCreateClient = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    cpf: new FormControl('', [Validators.pattern(/^\d{11}$/)]),
    address: new FormControl(''),
  });

  onSubmit() {
    if (this.formCreateClient.invalid) {
      this.formCreateClient.markAllAsTouched();
      return;
    }

    const cpf = this.formCreateClient.value.cpf?.trim();
    const address = this.formCreateClient.value.address?.trim();

    const newClient: Client = {
      name: this.formCreateClient.value.name || '',
      phone: this.formCreateClient.value.phone || '',
      address: address || undefined,
      cpf: cpf || undefined,
      active: true,
      createdAt: '',
      updatedAt: '',
    };

    this.creating = true;

    this.clientService.createClient(newClient).subscribe({
      next: (response) => {
        this.notification.success(`Cliente ${response.name} registrado com sucesso!`);
        this.creating = false;
        this.created.emit(response);
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao registrar cliente: ${e.error?.message || e.message}`);
      },
    });
  }

  cancel() {
    this.cancelled.emit();
  }
}
