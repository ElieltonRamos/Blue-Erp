import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyService } from '../services/company.service';
import { LicenseService } from '../../../core/services/license.service';
import { NotificationService } from '../../../shared/toastr/notification.service';

@Component({
  selector: 'app-company',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './company.html',
})
export class Company {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  companyForm: FormGroup;
  isLoading: boolean = false;
  showValidationErrors: boolean = false;

  canAccessFiscalFeatures = this.licenseService.getCurrentPlan() === 'pro';

  selectedFileName: string = '';
  selectedFile: File | null = null;

  selectedIbptFileName: string = '';
  selectedIbptFile: File | null = null;
  isUploadingIbpt: boolean = false;

  constructor() {
    this.companyForm = this.fb.group({
      cnpj: ['', Validators.required],
      corporateName: ['', Validators.required],
      tradeName: ['', Validators.required],
      stateRegistration: ['', Validators.required],
      taxRegime: ['1', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      complement: [''],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],
      cityCode: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.email]],
      nfceSeries: ['', Validators.required],
      nfceCurrentNumber: [0, Validators.required],
      nfceEnvironment: ['staging', Validators.required],
      nfceCsc: ['', Validators.required],
      nfceCscId: ['', Validators.required],
      certificatePath: ['', Validators.required],
      certificatePassword: ['', Validators.required],
    });
  }

  private blockIfNotPro(): boolean {
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas no plano Pro');
      return true;
    }
    return false;
  }

  ngOnInit(): void {
    this.loadCompanyData();
  }

  loadCompanyData(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.companyForm.patchValue(company);
        if (company.certificatePath) {
          this.selectedFileName = this.getFileName(company.certificatePath);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar empresa:', err);
        this.notification.error('Erro ao carregar dados da empresa');
        this.isLoading = false;
      },
    });
  }

  getFileName(path: string): string {
    return path.split(/[/\\]/).pop() || path;
  }

  // ===== CERTIFICADO =====
  triggerFileInput(): void {
    if (this.blockIfNotPro()) return;
    (document.getElementById('certificateFile') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event): void {
    if (this.blockIfNotPro()) return;
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.companyForm.patchValue({ certificatePath: file.name });
    }
  }

  enviarCertificado(): void {
    if (this.blockIfNotPro()) return;
    if (!this.selectedFile) {
      this.notification.error('Selecione um certificado antes de enviar.');
      return;
    }
    const certificatePassword = this.companyForm.get('certificatePassword')?.value;
    if (!certificatePassword) {
      this.notification.error('Informe a senha do certificado.');
      return;
    }
    this.isLoading = true;
    this.companyService.uploadCompanyCertificate(this.selectedFile, certificatePassword).subscribe({
      next: () => {
        this.notification.success('Certificado enviado com sucesso!');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao enviar certificado', err);
        this.notification.error('Erro ao enviar certificado.');
        this.isLoading = false;
      },
    });
  }

  // ===== IBPT =====
  triggerIbptFileInput(): void {
    if (this.blockIfNotPro()) return;
    (document.getElementById('ibptFile') as HTMLInputElement)?.click();
  }

  onIbptFileSelected(event: Event): void {
    if (this.blockIfNotPro()) return;
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.notification.error('Por favor, selecione um arquivo CSV válido.');
        input.value = '';
        return;
      }
      this.selectedIbptFile = file;
      this.selectedIbptFileName = file.name;
    }
  }

  enviarIbpt(): void {
    if (this.blockIfNotPro()) return;
    if (!this.selectedIbptFile) {
      this.notification.error('Selecione um arquivo CSV antes de enviar.');
      return;
    }
    this.isUploadingIbpt = true;
    this.companyService.importIbptFromCsv(this.selectedIbptFile).subscribe({
      next: (response) => {
        this.notification.success(response.message || 'Tabela IBPT atualizada com sucesso!');
        this.selectedIbptFile = null;
        this.selectedIbptFileName = '';
        const fileInput = document.getElementById('ibptFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.isUploadingIbpt = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao importar IBPT:', err);
        this.notification.error(err.error?.message || 'Erro ao importar tabela IBPT.');
        this.isUploadingIbpt = false;
      },
    });
  }

  // ===== GERAL =====
  onSubmit(): void {
    if (this.companyForm.valid) {
      this.showValidationErrors = false;
      this.isLoading = true;
      this.companyService.updateCompany(this.companyForm.value).subscribe({
        next: () => {
          this.notification.success('Empresa atualizada com sucesso!');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notification.error('Erro ao atualizar empresa');
          this.isLoading = false;
        },
      });
    } else {
      this.showValidationErrors = true;
      this.markAllAsTouched();
      const invalidFields = this.getInvalidFields();
      this.notification.error(`Por favor, preencha os campos obrigatórios: ${invalidFields.join(', ')}`);
    }
  }

  markAllAsTouched(): void {
    Object.keys(this.companyForm.controls).forEach(key => {
      this.companyForm.get(key)?.markAsTouched();
    });
  }

  getInvalidFields(): string[] {
    const fieldLabels: { [key: string]: string } = {
      cnpj: 'CNPJ', corporateName: 'Razão Social', tradeName: 'Nome Fantasia',
      stateRegistration: 'Inscrição Estadual', taxRegime: 'Regime Tributário',
      street: 'Logradouro', number: 'Número', neighborhood: 'Bairro',
      city: 'Município', cityCode: 'Código do Município', state: 'UF',
      zipCode: 'CEP', phone: 'Telefone', email: 'E-mail',
      nfceSeries: 'Série NFC-e', nfceCurrentNumber: 'Número Atual NFC-e',
      nfceEnvironment: 'Ambiente NFC-e', nfceCsc: 'CSC', nfceCscId: 'ID do CSC',
      certificatePath: 'Certificado', certificatePassword: 'Senha do Certificado',
    };

    return Object.keys(this.companyForm.controls)
      .filter(key => {
        const control = this.companyForm.get(key);
        return control?.invalid && control?.errors?.['required'];
      })
      .map(key => fieldLabels[key] || key);
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}