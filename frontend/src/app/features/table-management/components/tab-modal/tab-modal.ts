import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table } from '../../types/table';
import { OrderItem } from '../../../orders/types/order';

@Component({
  selector: 'app-tab-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-modal.html',
})
export class TabModal implements OnChanges {
  @Input() table!: Table;
  @Input() total = 0;
  @Input() show = false;

  @Output() close = new EventEmitter();
  @Output() finish = new EventEmitter<{
    serviceCharge: number;
    items: { id: number; serviceCharge: number }[];
  }>();

  serviceChargeEnabled = true;
  serviceChargeAmount = 0;

  get items(): OrderItem[] {
    return this.table?.order?.items ?? [];
  }

  get isDefaultServiceCharge(): boolean {
    const defaultValue = parseFloat((this.total * 0.1).toFixed(2));
    return parseFloat(this.serviceChargeAmount.toFixed(2)) === defaultValue;
  }

  get serviceChargeValue(): number {
    return this.serviceChargeEnabled ? this.serviceChargeAmount : 0;
  }

  ngOnChanges(): void {
    const existing = this.table?.order?.serviceCharge ?? 0;
    this.serviceChargeEnabled = existing > 0;

    if (this.serviceChargeEnabled) {
      const defaultValue = parseFloat((this.total * 0.1).toFixed(2));
      const existingRounded = parseFloat(existing.toFixed(2));
      // Se o valor salvo é próximo do padrão (10%), re-deriva do total atual
      this.serviceChargeAmount = existingRounded === defaultValue ? this.total * 0.1 : existing;
    } else {
      this.serviceChargeAmount = this.total * 0.1;
    }
  }

  toggleServiceCharge(): void {
    this.serviceChargeEnabled = !this.serviceChargeEnabled;
    if (this.serviceChargeEnabled) {
      this.serviceChargeAmount = this.total * 0.1;
    }
  }

  onServiceChargeInput(value: number): void {
    this.serviceChargeAmount = value;
  }

  distributeServiceCharge(): { id: number; serviceCharge: number }[] {
    if (!this.serviceChargeEnabled || this.serviceChargeAmount === 0) {
      return this.items.map((item) => ({ id: item.id!, serviceCharge: 0 }));
    }

    if (this.isDefaultServiceCharge) {
      return this.items.map((item) => ({
        id: item.id!,
        serviceCharge: parseFloat((item.total * 0.1).toFixed(2)),
      }));
    }

    const perItem = parseFloat((this.serviceChargeAmount / this.items.length).toFixed(2));
    return this.items.map((item) => ({ id: item.id!, serviceCharge: perItem }));
  }
}
