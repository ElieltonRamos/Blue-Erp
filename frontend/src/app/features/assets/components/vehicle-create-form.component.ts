import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../services/asset.service';
import { Asset, CreateAssetDTO } from '../types/asset.type';
import { NotificationService } from '../../../shared/toastr/notification.service';

@Component({
  selector: 'app-vehicle-create-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-create-form.component.html',
})
export class VehicleCreateFormComponent {
  @Input({ required: true }) clientId!: number;
  @Output() created = new EventEmitter<Asset>();
  @Output() cancelled = new EventEmitter<void>();

  private notification = inject(NotificationService);
  private assetService = inject(AssetService);
  private cdr = inject(ChangeDetectorRef);

  label = '';
  brand = '';
  model = '';
  year = '';
  km = '';
  creating = false;

  create() {
    if (!this.label.trim()) {
      this.notification.error('Informe a placa do veículo.');
      return;
    }

    const attributes = [
      { key: 'marca', value: this.brand.trim() },
      { key: 'modelo', value: this.model.trim() },
      { key: 'ano', value: this.year.trim() },
      { key: 'km', value: this.km.trim() },
    ].filter((a) => a.value !== '');

    const dto: CreateAssetDTO = {
      type: 'VEHICLE',
      label: this.label.trim(),
      clientId: this.clientId,
      attributes: attributes.length ? attributes : undefined,
    };

    this.creating = true;

    this.assetService.create(dto).subscribe({
      next: (asset) => {
        this.notification.success('Veículo cadastrado com sucesso!');
        this.creating = false;
        this.created.emit(asset);
      },
      error: (e) => {
        this.creating = false;
        this.notification.error(`Erro ao cadastrar veículo: ${e.error?.message || e.message}`);
      },
    });
  }

  cancel() {
    this.cancelled.emit();
  }
}
