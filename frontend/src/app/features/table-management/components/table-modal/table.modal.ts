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
import { Location, Table } from '../../types/table';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { TableService } from '../../services/table.service';
import { Observable } from 'rxjs';
import { TableMockService } from '../../services/table.mock.service';

interface ModalConfig {
  title: string;
  fields: FormField[];
  validate: (table: Table) => boolean;
  execute: (service: TableMockService, table: Table, tableId?: number) => Observable<any>;
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
  @Input() selectedLocation?: string;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Table>();

  config: ModalConfig | null = null;

  private tableService = inject(TableMockService);
  private notification = inject(NotificationService);

  private readonly configs: Record<string, ModalConfig> = {
    add: {
      title: 'Nova Mesa',
      fields: [
        { name: 'number', label: 'Número da Mesa', type: 'number', required: true },
        { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
        {
          name: 'locationId',
          label: 'Local',
          type: 'select',
          required: true,
          options: ['salao-01', 'salao-02', 'salao-03'], // ← NOVO CAMPO
        },
      ],
      validate: (table) => !!(table.number && table.capacity),
      execute: (service, table) => service.createTable(table),
    },

    edit: {
      title: 'Editar Mesa',
      fields: [
        { name: 'number', label: 'Número da Mesa', type: 'number', required: true },
        { name: 'capacity', label: 'Capacidade', type: 'number', required: true },
        { name: 'customer', label: 'Cliente', type: 'text' },
        {
          name: 'locationId',
          label: 'Local',
          type: 'select',
          required: true,
          options: ['salao-01', 'salao-02', 'salao-03'], // ← NOVO CAMPO
        },
      ],
      validate: (table) => !!(table.number && table.capacity),
      execute: (service, table, tableId) => service.editTable(tableId!, table),
    },

    reserve: {
      title: 'Reservar Mesa',
      fields: [
        { name: 'customer', label: 'Nome do Cliente', type: 'text', required: true },
        { name: 'time', label: 'Horário', type: 'datetime-local', required: true },
      ],
      validate: (table) => !!(table.customer && table.time),
      execute: (service, table, tableId) =>
        service.reserveTable(tableId!, table.customer!, table.time!),
    },

    occupy: {
      title: 'Ocupar Mesa',
      fields: [{ name: 'customer', label: 'Nome do Cliente', type: 'text', required: true }],
      validate: (table) => !!table.customer,
      execute: (service, table, tableId) => service.occupyTable(tableId!, table.customer!),
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] || changes['show'] || changes['entity']) {
      this.setupModal();
    }
  }

  private setupModal(): void {
    if (!this.type || !this.configs[this.type]) {
      this.config = null;
      return;
    }

    this.config = this.configs[this.type];

    if (!this.entity) {
      this.entity = {} as Table;
    } else {
      this.entity = {
        ...this.entity,
        locationId: this.entity.locationId || this.selectedLocation || 'salao-01',
      };
    }

    if (this.type !== 'add' && !this.tableId) {
      console.warn('TableModal aberto sem tableId:', this.type);
    }
  }

  onSave(table: Table): void {
    if (!this.config) {
      this.notification.error('Configuração inválida!');
      return;
    }

    if (!this.config.validate(table)) {
      this.notification.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const request$ = this.config.execute(this.tableService, table, this.tableId);

    request$.subscribe({
      next: () => {
        this.notification.success(`${this.config!.title} realizado com sucesso!`);
        this.saved.emit(table);
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
}
