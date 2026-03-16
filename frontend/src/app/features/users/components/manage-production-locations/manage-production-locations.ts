import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { alertConfirm } from '../../../../shared/alerts/custom-alerts';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { ProductionLocation, ProductionLocationsService } from '../../services/location.service';

@Component({
  selector: 'app-manage-production-locations',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ModalEditEntity],
  templateUrl: './manage-production-locations.html',
})
export class ManageProductionLocations implements OnInit {
  private notification = inject(NotificationService);
  private locationsService = inject(ProductionLocationsService);
  private cdr = inject(ChangeDetectorRef);

  locations: ProductionLocation[] = [];
  showModalEdit = false;
  editLocation: ProductionLocation = {
    id: 0,
    code: '',
    name: '',
    description: '',
    active: true,
    order: 0,
  };

  formCreate = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    description: new FormControl('', [Validators.maxLength(255)]),
    order: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  locationFields: FormField[] = [
    { name: 'code', label: 'Código', type: 'text', required: true },
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'description', label: 'Descrição', type: 'text' },
    { name: 'order', label: 'Ordem', type: 'number', required: true },
    {
      name: 'active',
      label: 'Status',
      type: 'select',
      options: ['Ativo', 'Inativo'],
      required: true,
    },
  ];

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.locationsService.getAll(true).subscribe({
      next: (locations) => {
        this.locations = locations;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.notification.error(`Erro ao carregar locais: ${e.error?.message || e.message}`);
      },
    });
  }

  onSubmit() {
    if (this.formCreate.invalid) {
      this.formCreate.markAllAsTouched();
      return;
    }

    const data = {
      code: this.formCreate.value.code || '',
      name: this.formCreate.value.name || '',
      description: this.formCreate.value.description || '',
      order: Number(this.formCreate.value.order) || 0,
      active: true,
    };

    this.locationsService.create(data).subscribe({
      next: (response) => {
        this.notification.success(`Local ${response.name} criado com sucesso!`);
        this.formCreate.reset({ order: this.locations.length });
        this.loadLocations();
      },
      error: (e) => {
        this.notification.error(`Erro ao criar local: ${e.error?.message || e.message}`);
      },
    });
  }

  openModalEdit(location: ProductionLocation) {
    this.editLocation = { ...location };
    this.showModalEdit = true;
  }

  closeModalEdit() {
    this.showModalEdit = false;
    this.loadLocations();
  }

  onSave(location: ProductionLocation) {
    const data = {
      code: location.code,
      name: location.name,
      description: location.description || undefined,
      order: Number(location.order),
      active: location.active,
    };

    this.locationsService.update(location.id, data).subscribe({
      next: () => {
        this.notification.success('Local atualizado com sucesso!');
        this.closeModalEdit();
      },
      error: (e) => {
        this.notification.error(`Erro ao atualizar local: ${e.error?.message || e.message}`);
      },
    });
  }

  toggleActive(location: ProductionLocation) {
    this.locationsService.toggleActive(location.id).subscribe({
      next: () => {
        this.notification.success(
          `Local ${location.active ? 'desativado' : 'ativado'} com sucesso!`,
        );
        this.loadLocations();
      },
      error: (e) => {
        this.notification.error(`Erro ao alterar status: ${e.error?.message || e.message}`);
      },
    });
  }

  deleteLocation(location: ProductionLocation) {
    alertConfirm(`Tem certeza que deseja excluir o local "${location.name}"?`).then((result) => {
      if (result) {
        this.locationsService.delete(location.id).subscribe({
          next: () => {
            this.notification.success('Local excluído com sucesso!');
            this.loadLocations();
          },
          error: (e) => {
            this.notification.error(`Erro ao excluir local: ${e.error?.message || e.message}`);
          },
        });
      }
    });
  }
}
