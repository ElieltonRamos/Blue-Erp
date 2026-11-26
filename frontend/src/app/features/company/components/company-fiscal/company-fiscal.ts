import { ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService, CompanyUpdate } from '../../services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { Company } from '../../types/company';

const FIELD_LABELS: Record<string, string> = {
  nfceEnvironment: 'Ambiente NFC-e',
  nfceCsc: 'CSC',
  nfceCscId: 'ID do CSC',
  nfeEnvironment: 'Ambiente NF-e',
  simplesCreditRate: 'Crédito Simples Nacional (%)',
};

@Component({
  selector: 'app-company-fiscal',
  imports: [ReactiveFormsModule],
  templateUrl: './company-fiscal.html',
})
export class CompanyFiscal implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dirtyChange = output<boolean>();

  readonly SENSITIVE_PLACEHOLDER = '••••••';

  isLoading = false;

  // Somente leitura (controlados pelo backend)
  nfceSeries = '';
  nfceCurrentNumber = 0;
  nfeSeries = '';
  nfeCurrentNumber = 0;

  nfceCscConfigured = false;
  nfceCscIdConfigured = false;

  form = this.fb.nonNullable.group({
    nfceEnvironment: ['staging' as Company['nfceEnvironment'], Validators.required],
    nfceCsc: ['', Validators.required],
    nfceCscId: ['', Validators.required],
    nfeEnvironment: ['staging' as Company['nfeEnvironment'], Validators.required],
    simplesCreditRate: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(100),
    ]),
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.dirtyChange.emit(this.form.dirty));
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.nfceSeries = company.nfceSeries;
        this.nfceCurrentNumber = company.nfceCurrentNumber;
        this.nfeSeries = company.nfeSeries;
        this.nfeCurrentNumber = company.nfeCurrentNumber;

        this.nfceCscConfigured = company.nfceCscConfigured;
        this.nfceCscIdConfigured = company.nfceCscIdConfigured;

        this.form.patchValue({
          nfceEnvironment: company.nfceEnvironment,
          nfeEnvironment: company.nfeEnvironment,
          simplesCreditRate: company.simplesCreditRate,
        });

        if (this.nfceCscConfigured) this.relaxSensitive('nfceCsc');
        if (this.nfceCscIdConfigured) this.relaxSensitive('nfceCscId');

        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao carregar dados fiscais');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Campo sensível já configurado: vazio = manter valor atual
  private relaxSensitive(name: 'nfceCsc' | 'nfceCscId'): void {
    const control = this.form.controls[name];
    control.setValue('');
    control.clearValidators();
    control.updateValueAndValidity();
  }

  hasError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const invalid = Object.keys(this.form.controls)
        .filter((key) => this.form.get(key)?.invalid)
        .map((key) => FIELD_LABELS[key] ?? key);
      this.notification.error(`Preencha os campos obrigatórios: ${invalid.join(', ')}`);
      return;
    }

    const { nfceCsc, nfceCscId, ...rest } = this.form.getRawValue();
    const payload: CompanyUpdate = { ...rest };
    if (nfceCsc) payload.nfceCsc = nfceCsc;
    if (nfceCscId) payload.nfceCscId = nfceCscId;

    this.isLoading = true;
    this.companyService.updateCompany(payload).subscribe({
      next: () => {
        this.notification.success('Configurações fiscais atualizadas com sucesso!');

        if (nfceCsc) {
          this.nfceCscConfigured = true;
          this.relaxSensitive('nfceCsc');
        }
        if (nfceCscId) {
          this.nfceCscIdConfigured = true;
          this.relaxSensitive('nfceCscId');
        }

        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao atualizar configurações fiscais');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
