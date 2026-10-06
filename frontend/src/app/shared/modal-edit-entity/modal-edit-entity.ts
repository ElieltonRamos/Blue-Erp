import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: (string | FieldOption)[];
  required?: boolean;
  showIf?: (entity: any) => boolean;
  mask?: string;
  section?: string;
}

@Component({
  selector: 'app-modal-edit-entity',
  imports: [FormsModule, NgIcon, NgxMaskDirective],
  templateUrl: './modal-edit-entity.html',
  providers: [provideNgxMask()],
  styles: ``,
})
export class ModalEditEntity {
  @Input() title: string = 'Editar';
  @Input() show: boolean = false;
  @Input() entity: any = {};
  @Input() fields: FormField[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  showPassword = false;

  isVisible(field: FormField): boolean {
    return field.showIf ? field.showIf(this.entity) : true;
  }

  // Mostra o título quando a seção muda em relação ao campo anterior
  // (os campos de uma mesma seção devem ficar contíguos em `fields`).
  isSectionStart(index: number): boolean {
    const section = this.fields[index].section;
    return !!section && section !== this.fields[index - 1]?.section;
  }

  optionValue(opt: string | FieldOption): string {
    return typeof opt === 'string' ? opt : opt.value;
  }

  optionLabel(opt: string | FieldOption): string {
    return typeof opt === 'string' ? opt : opt.label;
  }

  onClose() {
    this.close.emit();
  }

  onSave() {
    this.save.emit(this.entity);
  }
}
