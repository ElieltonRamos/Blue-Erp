import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ClientService } from '../../services/client.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { ClientMockService } from '../../services/client.mock.service';

@Component({
  selector: 'app-create-client',
  imports: [ReactiveFormsModule, NgxMaskDirective],
  templateUrl: './create-client.html',
  providers: [provideNgxMask()],
})
export class CreateClient {
  private clientService = inject(ClientMockService);
  private notification = inject(NotificationService);

  formCreateClient = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    cpf: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{11}$/), // apenas 11 dígitos
    ]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{11}$/), // 11 dígitos (com DDD)
    ]),
    address: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });

  onSubmit() {
    if (this.formCreateClient.valid) {
      const newClient = {
        name: this.formCreateClient.value.name || '',
        phone: this.formCreateClient.value.phone || '',
        address: this.formCreateClient.value.address || '',
        cpf: this.formCreateClient.value.cpf || '',
      };
      this.clientService.createClient(newClient).subscribe({
        next: (response) => {
          this.notification.success(`Cliente ${response.name} registrado com sucesso!`);
          this.formCreateClient.reset(); // limpa o formulário após o envio
        },
        error: (error) => {
          this.notification.error(
            `Erro ao registrar cliente: ${error.error?.message || error.message}`,
          );
        },
      });
    } else {
      this.formCreateClient.markAllAsTouched(); // ativa os erros visuais
    }
  }
}
