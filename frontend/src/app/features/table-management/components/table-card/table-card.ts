import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Table } from '../../types/table';

@Component({
  selector: 'app-table-card',
  imports: [],
  templateUrl: './table-card.html',
})
export class TableCard {
  @Input() table: any;
  @Input() statusColors: any;
  @Input() statusLabels: any;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() reserve = new EventEmitter<any>();
  @Output() occupy = new EventEmitter<any>();
  @Output() products = new EventEmitter<any>();
  @Output() tab = new EventEmitter<any>();
  @Output() release = new EventEmitter<any>();
  @Output() transfer = new EventEmitter<any>();
  @Output() reprint = new EventEmitter<any>();
}
