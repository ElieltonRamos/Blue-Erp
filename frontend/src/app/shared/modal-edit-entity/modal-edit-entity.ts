import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  showIf?: (entity: any) => boolean;
}

@Component({
  selector: 'app-modal-edit-entity',
  imports: [FormsModule, NgIcon],
  templateUrl: './modal-edit-entity.html',
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

  onClose() {
    this.close.emit();
  }

  onSave() {
    this.save.emit(this.entity);
  }
}
