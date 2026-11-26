import { ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { Company } from '../../types/company';

const FIELD_LABELS: Record<string, string> = {
  cnpj: 'CNPJ',
  corporateName: 'Razão Social',
  tradeName: 'Nome Fantasia',
  stateRegistration: 'Inscrição Estadual',
  taxRegime: 'Regime Tributário',
  phone: 'Telefone',
  email: 'E-mail',
  zipCode: 'CEP',
  street: 'Logradouro',
  number: 'Número',
  neighborhood: 'Bairro',
  city: 'Município',
  cityCode: 'Código do Município',
  state: 'UF',
};

@Component({
  selector: 'app-company-registration',
  imports: [ReactiveFormsModule],
  templateUrl: './company-registration.html',
})
export class CompanyRegistration implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dirtyChange = output<boolean>();

  isLoading = false;

  readonly states = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  form = this.fb.nonNullable.group({
    cnpj: ['', Validators.required],
    corporateName: ['', Validators.required],
    tradeName: ['', Validators.required],
    stateRegistration: ['', Validators.required],
    taxRegime: ['1' as Company['taxRegime'], Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.email],
    zipCode: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    complement: [''],
    neighborhood: ['', Validators.required],
    city: ['', Validators.required],
    cityCode: ['', Validators.required],
    state: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.dirtyChange.emit(this.form.dirty));
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.form.patchValue({
          ...company,
          complement: company.complement ?? '',
          email: company.email ?? '',
        });
        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao carregar dados da empresa');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
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

    this.isLoading = true;
    this.companyService.updateCompany(this.form.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Dados da empresa atualizados com sucesso!');
        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao atualizar empresa');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
