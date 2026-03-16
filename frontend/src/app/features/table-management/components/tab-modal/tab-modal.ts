import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Table } from '../../types/table';

@Component({
  selector: 'app-tab-modal',
  imports: [],
  templateUrl: './tab-modal.html',
})
export class TabModal {
  @Input() table!: Table;
  @Input() total = 0;
  @Input() show = false;

  @Output() close = new EventEmitter();
  @Output() finish = new EventEmitter();
}
