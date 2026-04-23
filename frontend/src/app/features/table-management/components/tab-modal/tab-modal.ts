import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Table } from '../../types/table';

@Component({
  selector: 'app-tab-modal',
  imports: [],
  templateUrl: './tab-modal.html',
})
export class TabModal {
  serviceChargeEnabled = true;
  serviceChargeValue = 0;
  @Input() table!: Table;
  @Input() total = 0;
  @Input() show = false;

  @Output() close = new EventEmitter();
  @Output() finish = new EventEmitter<number>();

  ngOnChanges(): void {
    console.log(this.serviceChargeValue, 'gorjeta')
    const existing = this.table?.order?.serviceCharge ?? 0;

    this.serviceChargeEnabled = existing > 0;
    this.serviceChargeValue = this.serviceChargeEnabled ? this.total * 0.1 : 0;
  }

  toggleServiceCharge(): void {
    this.serviceChargeEnabled = !this.serviceChargeEnabled;

    this.serviceChargeValue = this.serviceChargeEnabled ? this.total * 0.1 : 0;
  }
}
