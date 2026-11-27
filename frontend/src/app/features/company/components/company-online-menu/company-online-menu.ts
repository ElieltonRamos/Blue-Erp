import { ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { OnlineMenuSettings, OnlineMenuSettingsUpdate, OnlinePaymentType, OpeningHour } from '../../types/online-menu';

const MAX_HOURS = 35;

const PAYMENT_TYPES: { type: OnlinePaymentType; label: string }[] = [
  { type: 'pix', label: 'Pix' },
  { type: 'card', label: 'Cartão' },
  { type: 'cash', label: 'Dinheiro' },
];

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type HourGroup = FormGroup<{
  weekday: FormControl<number>;
  opensAt: FormControl<string>;
  closesAt: FormControl<string>;
}>;

@Component({
  selector: 'app-company-online-menu',
  imports: [ReactiveFormsModule],
  templateUrl: './company-online-menu.html',
})
export class CompanyOnlineMenu implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dirtyChange = output<boolean>();

  readonly paymentTypes = PAYMENT_TYPES;
  readonly weekdays = WEEKDAYS;

  isLoading = false;
  isSavingSettings = false;
  isSavingHours = false;

  settingsForm = this.fb.group({
    onlineMenuEnabled: this.fb.nonNullable.control(false),
    onlineOrdersPaused: this.fb.nonNullable.control(false),
    onlineMenuControlStock: this.fb.nonNullable.control(true),
    timezone: this.fb.nonNullable.control('America/Sao_Paulo', Validators.required),
    whatsapp: this.fb.nonNullable.control('', Validators.pattern(/^\d{10,13}$/)),
    instagram: this.fb.nonNullable.control('', Validators.maxLength(100)),
    logoUrl: this.fb.nonNullable.control('', Validators.maxLength(191)),
    latitude: new FormControl<number | null>(null, [Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl<number | null>(null, [Validators.min(-180), Validators.max(180)]),
    deliveryTimeMin: new FormControl<number | null>(null, Validators.min(0)),
    deliveryTimeMax: new FormControl<number | null>(null, Validators.min(0)),
    takeoutTime: new FormControl<number | null>(null, Validators.min(0)),
    deliveryFee: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
    minOrderValue: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
    payments: this.fb.group({
      pix: this.paymentGroup('Pix'),
      card: this.paymentGroup('Cartão'),
      cash: this.paymentGroup('Dinheiro'),
    }),
  });

  hoursForm = this.fb.group({
    hours: new FormArray<HourGroup>([]),
  });

  get hours(): FormArray<HourGroup> {
    return this.hoursForm.controls.hours;
  }

  private paymentGroup(label: string) {
    return this.fb.nonNullable.group({
      enabled: false,
      label: [label, Validators.maxLength(50)],
    });
  }

  private hourGroup(hour?: Partial<OpeningHour>): HourGroup {
    return this.fb.nonNullable.group({
      weekday: hour?.weekday ?? 1,
      opensAt: [hour?.opensAt ?? '18:00', Validators.required],
      closesAt: [hour?.closesAt ?? '23:00', Validators.required],
    });
  }

  ngOnInit(): void {
    this.settingsForm.valueChanges.subscribe(() => this.emitDirty());
    this.hoursForm.valueChanges.subscribe(() => this.emitDirty());
    this.load();
  }

  private emitDirty(): void {
    this.dirtyChange.emit(this.settingsForm.dirty || this.hoursForm.dirty);
  }

  private apiError(err: { error?: { message?: string | string[] } }, fallback: string): string {
    const message = err?.error?.message;
    return Array.isArray(message) ? message.join(', ') : (message ?? fallback);
  }

  private load(): void {
    this.isLoading = true;
    this.companyService.getOnlineMenuSettings().subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.applyHours(settings.openingHours);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(this.apiError(err, 'Erro ao carregar o cardápio online'));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applySettings(s: OnlineMenuSettings): void {
    this.settingsForm.patchValue({
      onlineMenuEnabled: s.onlineMenuEnabled,
      onlineOrdersPaused: s.onlineOrdersPaused,
      onlineMenuControlStock: s.onlineMenuControlStock,
      timezone: s.timezone,
      whatsapp: s.whatsapp ?? '',
      instagram: s.instagram ?? '',
      logoUrl: s.logoUrl ?? '',
      latitude: s.latitude,
      longitude: s.longitude,
      deliveryTimeMin: s.deliveryTimeMin,
      deliveryTimeMax: s.deliveryTimeMax,
      takeoutTime: s.takeoutTime,
      deliveryFee: s.deliveryFee,
      minOrderValue: s.minOrderValue,
    });

    for (const p of PAYMENT_TYPES) {
      const method = s.onlinePaymentMethods.find((m) => m.type === p.type);
      this.settingsForm.controls.payments.get(p.type)?.patchValue({ enabled: !!method, label: method?.label ?? p.label });
    }

    this.settingsForm.markAsPristine();
    this.emitDirty();
  }

  private applyHours(hours: OpeningHour[]): void {
    this.hours.clear({ emitEvent: false });
    hours.forEach((h) => this.hours.push(this.hourGroup(h), { emitEvent: false }));
    this.hoursForm.markAsPristine();
    this.emitDirty();
  }

  hasError(name: string): boolean {
    const control = this.settingsForm.get(name);
    return !!control && control.invalid && control.touched;
  }

  // ===== Configurações =====
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.notification.error('Revise os campos destacados.');
      return;
    }

    const v = this.settingsForm.getRawValue();

    if (v.deliveryTimeMin !== null && v.deliveryTimeMax !== null && v.deliveryTimeMin > v.deliveryTimeMax) {
      this.notification.error('O tempo mínimo de entrega não pode ser maior que o máximo.');
      return;
    }

    const methods = PAYMENT_TYPES.filter((p) => v.payments[p.type].enabled).map((p) => ({
      type: p.type,
      label: v.payments[p.type].label.trim(),
    }));

    if (methods.some((m) => !m.label)) {
      this.notification.error('Informe o nome de todas as formas de pagamento ativas.');
      return;
    }

    const payload: OnlineMenuSettingsUpdate = {
      onlineMenuEnabled: v.onlineMenuEnabled,
      onlineOrdersPaused: v.onlineOrdersPaused,
      onlineMenuControlStock: v.onlineMenuControlStock,
      timezone: v.timezone.trim(),
      whatsapp: v.whatsapp.trim() || null,
      instagram: v.instagram.trim() || null,
      logoUrl: v.logoUrl.trim() || null,
      latitude: v.latitude,
      longitude: v.longitude,
      deliveryTimeMin: v.deliveryTimeMin,
      deliveryTimeMax: v.deliveryTimeMax,
      takeoutTime: v.takeoutTime,
      deliveryFee: v.deliveryFee ?? 0,
      minOrderValue: v.minOrderValue ?? 0,
      onlinePaymentMethods: methods,
    };

    this.isSavingSettings = true;
    this.companyService.updateOnlineMenuSettings(payload).subscribe({
      next: () => {
        this.notification.success('Configurações do cardápio atualizadas com sucesso!');
        this.settingsForm.markAsPristine();
        this.emitDirty();
        this.isSavingSettings = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(this.apiError(err, 'Erro ao atualizar configurações'));
        this.isSavingSettings = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ===== Horários =====
  addHour(): void {
    if (this.hours.length >= MAX_HOURS) {
      this.notification.error(`Informe no máximo ${MAX_HOURS} intervalos de horário.`);
      return;
    }
    this.hours.push(this.hourGroup());
    this.hoursForm.markAsDirty();
    this.emitDirty();
  }

  removeHour(index: number): void {
    this.hours.removeAt(index);
    this.hoursForm.markAsDirty();
    this.emitDirty();
  }

  saveHours(): void {
    if (this.hoursForm.invalid) {
      this.hoursForm.markAllAsTouched();
      this.notification.error('Preencha o horário de abertura e fechamento de todos os intervalos.');
      return;
    }

    const hours: OpeningHour[] = this.hours.getRawValue().map((h) => ({
      weekday: h.weekday,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    }));

    if (hours.some((h) => h.opensAt === h.closesAt)) {
      this.notification.error('A abertura e o fechamento não podem ser iguais.');
      return;
    }

    this.isSavingHours = true;
    this.companyService.replaceOpeningHours(hours).subscribe({
      next: (response) => {
        this.notification.success('Horários de funcionamento atualizados com sucesso!');
        this.applyHours(response.openingHours);
        this.isSavingHours = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(this.apiError(err, 'Erro ao atualizar horários'));
        this.isSavingHours = false;
        this.cdr.detectChanges();
      },
    });
  }
}
