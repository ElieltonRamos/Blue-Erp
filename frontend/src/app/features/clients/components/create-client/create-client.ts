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
  showFiscal = false;

  formCreateClient = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    personType: new FormControl<'PF' | 'PJ'>('PF'), // só controla a tela, não é enviado
    cpf: new FormControl('', [Validators.pattern(/^\d{11}$/)]),
    cnpj: new FormControl('', [Validators.pattern(/^\d{14}$/)]),
    address: new FormControl(''),
    stateRegistration: new FormControl(''),
    ieIndicator: new FormControl(''),
    zipCode: new FormControl('', [Validators.pattern(/^\d{8}$/)]),
    street: new FormControl(''),
    number: new FormControl(''),
    complement: new FormControl(''),
    neighborhood: new FormControl(''),
    city: new FormControl(''),
    cityCode: new FormControl('', [Validators.pattern(/^\d{7}$/)]),
    state: new FormControl('', [Validators.pattern(/^[A-Za-z]{2}$/)]),
  });

  get isPessoaJuridica(): boolean {
    return this.formCreateClient.value.personType === 'PJ';
  }

  toggleFiscal() {
    this.showFiscal = !this.showFiscal;
  }

  onPersonTypeChange() {
    // limpa o documento do tipo que saiu de cena
    this.formCreateClient.patchValue({ cpf: '', cnpj: '' });
  }

  onSubmit() {
    if (this.formCreateClient.invalid) {
      this.formCreateClient.markAllAsTouched();
      return;
    }

    const v = this.formCreateClient.value;
    const text = (value?: string | null) => value?.trim() || undefined;

    const newClient: Client = {
      name: v.name || '',
      phone: v.phone || '',
      address: text(v.address),
      cpf: text(v.cpf),
      cnpj: text(v.cnpj),
      stateRegistration: text(v.stateRegistration),
      ieIndicator: (text(v.ieIndicator) as Client['ieIndicator']) ?? undefined,
      zipCode: text(v.zipCode),
      street: text(v.street),
      number: text(v.number),
      complement: text(v.complement),
      neighborhood: text(v.neighborhood),
      city: text(v.city),
      cityCode: text(v.cityCode),
      state: text(v.state)?.toUpperCase(),
      active: true,
      createdAt: '',
      updatedAt: '',
    };

    this.creating = true;

    this.clientService.createClient(newClient).subscribe({
      next: (response) => {
        this.notification.success(`Cliente ${response.name} registrado com sucesso!`);
        this.creating = false;
        this.resetForm();
        this.created.emit(response);
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao registrar cliente: ${e.error?.message || e.message}`);
      },
    });
  }

  private resetForm() {
    this.formCreateClient.reset({ personType: 'PF' });
    this.showFiscal = false;
  }

  cancel() {
    this.cancelled.emit();
  }
}
