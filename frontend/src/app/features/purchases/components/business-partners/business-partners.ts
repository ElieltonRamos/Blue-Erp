// business-partners.ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { ModalEditEntity, FormField } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { BusinessPartnerService } from '../../services/business-partner.service';
import {
  BusinessPartner,
  BusinessPartnerFilters,
  CreateBusinessPartnerDTO,
  PartnerType,
} from '../../types/business-partner';

@Component({
  selector: 'app-business-partners',
  imports: [CommonModule, FormsModule, ModalEditEntity],
  templateUrl: './business-partners.html',
})
export class BusinessPartners {
  private notification = inject(NotificationService);
  private partnerService = inject(BusinessPartnerService);
  private cdr = inject(ChangeDetectorRef);

  // --- Listagem ---
  listPartners: BusinessPartner[] = [];
  filter: BusinessPartnerFilters = { type: '', search: '' };

  // --- Criação ---
  newPartner: CreateBusinessPartnerDTO = {
    type: 'SUPPLIER',
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    stateRegistration: '',
    city: '',
    state: '',
    rntc: '',
  };

  partnerTypes: { value: PartnerType; label: string }[] = [
    { value: 'SUPPLIER', label: 'Fornecedor' },
    { value: 'EMPLOYEE', label: 'Funcionário' },
    { value: 'CARRIER', label: 'Transportadora' },
    { value: 'ACCOUNTANT', label: 'Contador' },
    { value: 'BANK', label: 'Banco' },
  ];

  // --- Edição ---
  showModalEdit = false;
  editPartner: any = {};
  editingId: number | null = null;
  partnerFields: FormField[] = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'document', label: 'CNPJ/CPF', type: 'text' },
    { name: 'phone', label: 'Telefone', type: 'text' },
    { name: 'email', label: 'E-mail', type: 'text' },
    { name: 'address', label: 'Endereço', type: 'text' },
    { name: 'stateRegistration', label: 'Inscrição estadual', type: 'text' },
    { name: 'city', label: 'Cidade', type: 'text' },
    { name: 'state', label: 'UF', type: 'text' },
    {
      name: 'rntc',
      label: 'RNTC/ANTT',
      type: 'text',
      showIf: (entity) => entity.type === 'CARRIER',
    },
  ];

  ngOnInit() {
    this.loadPartners();
  }

  loadPartners() {
    this.partnerService.getAll(this.filter).subscribe({
      next: (partners) => {
        this.listPartners = partners;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar fornecedores: ${e.error?.message || e.message}`);
      },
    });
  }

  applyFilters() {
    this.loadPartners();
  }

  clearFilters() {
    this.filter = { type: '', search: '' };
    this.applyFilters();
  }

  createPartner() {
    if (!this.newPartner.name?.trim()) {
      this.notification.error('Informe o nome do parceiro');
      return;
    }

    const dto: CreateBusinessPartnerDTO = {
      ...this.newPartner,
      state: this.newPartner.state?.trim().toUpperCase(),
      rntc: this.newPartner.type === 'CARRIER' ? this.newPartner.rntc : undefined,
    };

    this.partnerService.create(dto).subscribe({
      next: () => {
        this.notification.success('Parceiro cadastrado com sucesso');
        this.resetNewPartner();
        this.loadPartners();
      },
      error: (e) => {
        this.notification.error(`Erro ao cadastrar parceiro: ${e.error?.message || e.message}`);
      },
    });
  }

  private resetNewPartner() {
    this.newPartner = {
      type: 'SUPPLIER',
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      stateRegistration: '',
      city: '',
      state: '',
      rntc: '',
    };
  }

  openEditModal(partner: BusinessPartner) {
    this.editingId = partner.id;
    this.editPartner = {
      type: partner.type,
      name: partner.name,
      document: partner.document || '',
      phone: partner.phone || '',
      email: partner.email || '',
      address: partner.address || '',
      stateRegistration: partner.stateRegistration || '',
      city: partner.city || '',
      state: partner.state || '',
      rntc: partner.rntc || '',
    };
    this.showModalEdit = true;
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.editingId = null;
    this.editPartner = {};
  }

  onEditSave(data: any) {
    if (this.editingId === null) return;

    const { type: _type, ...rest } = data;
    const payload = { ...rest, state: rest.state?.trim().toUpperCase() };

    this.partnerService.update(this.editingId, payload).subscribe({
      next: () => {
        this.notification.success('Parceiro atualizado com sucesso');
        this.closeModalEdit();
        this.loadPartners();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar parceiro: ${e.error?.message || e.message}`);
      },
    });
  }

  deactivatePartner(partner: BusinessPartner) {
    alertConfirm('Inativar este parceiro?').then((result) => {
      if (result) {
        this.partnerService.remove(partner.id).subscribe({
          next: () => {
            this.notification.success('Parceiro inativado com sucesso');
            this.loadPartners();
          },
          error: (e) => {
            this.notification.error(`Erro ao inativar parceiro: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }

  partnerTypeLabel(type: PartnerType): string {
    return this.partnerTypes.find((t) => t.value === type)?.label || type;
  }
}
