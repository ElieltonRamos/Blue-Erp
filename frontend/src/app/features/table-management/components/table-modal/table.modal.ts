import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormField, ModalEditEntity } from '../../../../shared/modal-edit-entity/modal-edit-entity';
import { Table } from '../../types/table';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { TableService } from '../../services/table.service';
import { Observable } from 'rxjs';
import { ProductionLocation } from '../../../users/services/location.service';

interface ModalConfig {
  title: string;
  fields: FormField[];
  validate: (data: any) => boolean;
  execute: (service: TableService, data: any, tableId?: number) => Observable<any>;
}

@Component({
  selector: 'app-table-modal',
  standalone: true,
  imports: [CommonModule, ModalEditEntity],
  template: `
    <app-modal-edit-entity
      [title]="config?.title || ''"
      [show]="show"
      [entity]="entity"
      [fields]="config?.fields || []"
      (close)="close.emit()"
      (save)="onSave($event)"
    />
  `,
})
export class TableModalComponent implements OnChanges {
  @Input() show = false;
  @Input() type!: 'add' | 'edit' | 'reserve' | 'occupy';
  @Input() entity: Table | null = null;
  @Input() tableId?: number;
  @Input() selectedLocation: number | null = null;
  @Input() locations: ProductionLocation[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  config: ModalConfig | null = null;

  private tableService = inject(TableService);
  private notification = inject(NotificationService);

  private buildConfigs(): Record<string, ModalConfig> {
    const locationOptions = this.locations.map((l) => l.name);

    return {
      add: {
        title: 'Nova Mesa',
        fields: [
          { name: 'number', label: 'Número da Mesa', type: 'number', placeholder: '0', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', placeholder: '0', required: true },
          {
            name: 'locationId',
            label: 'Local',
            type: 'select',
            required: true,
            options: locationOptions,
          },
        ],
        validate: (data) => !!(data.number && data.capacity && data.locationId),
        execute: (service, data) => {
          const locationId = this.getLocationIdByName(data.locationId);
          return service.createTable({
            number: Number(data.number),
            capacity: Number(data.capacity),
            locationId: locationId!,
          });
        },
      },

      edit: {
        title: 'Editar Mesa',
        fields: [
          { name: 'number', label: 'Número da Mesa', type: 'number', required: true },
          { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
          { name: 'customer', label: 'Nome do Cliente', type: 'text', required: true },
          {
            name: 'locationId',
            label: 'Local',
            type: 'select',
            required: true,
            options: locationOptions,
          },
        ],
        validate: (data) => !!(data.number && data.capacity && data.locationId),
        execute: (service, data) => {
          const locationId = this.getLocationIdByName(data.locationId);
          return service.editTable(data.id, {
            number: Number(data.number),
            capacity: Number(data.capacity),
            locationId: locationId,
            customer: data.customer,
          });
        },
      },

      reserve: {
        title: 'Reservar Mesa',
        fields: [
          { name: 'customer', label: 'Nome do Cliente', type: 'text', required: true },
          { name: 'time', label: 'Horário', type: 'datetime-local', required: true },
        ],
        validate: (data) => !!(data.customer && data.time),
        execute: (service, data, tableId) =>
          service.reserveTable(tableId!, data.customer, data.time),
      },

      occupy: {
        title: 'Ocupar Mesa',
        fields: [{ name: 'customer', label: 'Nome do Cliente', type: 'text', required: true }],
        validate: (data) => !!data.customer,
        execute: (service, data, tableId) => service.occupyTable(tableId!, data.customer),
      },
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] || changes['show'] || changes['entity'] || changes['locations']) {
      this.setupModal();
    }
  }

  private setupModal(): void {
    if (!this.type) {
      this.config = null;
      return;
    }

    const configs = this.buildConfigs();
    this.config = configs[this.type] || null;

    if (!this.entity) {
      this.entity = {
        locationId: this.selectedLocation ?? undefined,
      } as any;
    }

    if (this.type !== 'add' && !this.tableId) {
      console.warn('TableModal aberto sem tableId:', this.type);
    }
  }

  onSave(data: any): void {
    if (!this.config) {
      this.notification.error('Configuração inválida!');
      return;
    }

    if (!this.config.validate(data)) {
      this.notification.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const request$ = this.config.execute(this.tableService, data, this.tableId);

    request$.subscribe({
      next: () => {
        this.notification.success(`${this.config!.title} realizado com sucesso!`);
        this.saved.emit();
        this.close.emit();
      },
      error: (error: any) => {
        console.error('Modal save error:', error);
        this.notification.error(
          `Erro: ${error.error?.message || error.message || 'Tente novamente'}`,
        );
      },
    });
  }

  private getLocationIdByName(name: string): number | undefined {
    return this.locations.find((l) => l.name === name)?.id;
  }
}
