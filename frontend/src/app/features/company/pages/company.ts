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

  // ✅ Verificar plano
  canAccessFiscalFeatures = this.licenseService.getCurrentPlan() !== 'pro';

  // Campos para certificado
  selectedFileName: string = '';
  selectedFile: File | null = null;

  // Campos para IBPT
  selectedIbptFileName: string = '';
  selectedIbptFile: File | null = null;
  isUploadingIbpt: boolean = false;

  constructor() {
    this.companyForm = this.fb.group({
      cnpj: ['', Validators.required], // CNPJ da empresa
      corporateName: ['', Validators.required], // Razão social
      tradeName: ['', Validators.required], // Nome fantasia
      stateRegistration: ['', Validators.required], // Inscrição estadual
      taxRegime: ['1', Validators.required], // Regime tributário
      street: ['', Validators.required], // Logradouro
      number: ['', Validators.required], // Número
      complement: [''], // Complemento
      neighborhood: ['', Validators.required], // Bairro
      city: ['', Validators.required], // Município
      cityCode: ['', Validators.required], // Código do município
      state: ['', Validators.required], // UF
      zipCode: ['', Validators.required], // CEP
      phone: ['', Validators.required], // Telefone
      email: ['', [Validators.email]], // E-mail
      nfceSeries: ['', Validators.required], // Série da NFC-e
      nfceCurrentNumber: [0, Validators.required], // Número atual da NFC-e
      nfceEnvironment: ['staging', Validators.required], // Ambiente da NFC-e
      nfceCsc: ['', Validators.required], // CSC
      nfceCscId: ['', Validators.required], // ID do CSC
      certificatePath: ['', Validators.required], // Caminho do certificado
      certificatePassword: ['', Validators.required], // Senha do certificado
    });
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

  // ===== MÉTODOS PARA CERTIFICADO =====
  onFileSelected(event: Event): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas no plano Pro');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.companyForm.patchValue({
        certificatePath: file.name,
      });
    }
  }

  getFileName(path: string): string {
    return path.split(/[/\\]/).pop() || path;
  }

  triggerFileInput(): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas nos planos Premium e Pro');
      return;
    }

    const fileInput = document.getElementById('certificateFile') as HTMLInputElement;
    fileInput?.click();
  }

  enviarCertificado(): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas nos planos Premium e Pro');
      return;
    }

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

  // ===== MÉTODOS PARA IBPT =====
  onIbptFileSelected(event: Event): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas nos planos Premium e Pro');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
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

  triggerIbptFileInput(): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas nos planos Premium e Pro');
      return;
    }

    const fileInput = document.getElementById('ibptFile') as HTMLInputElement;
    fileInput?.click();
  }

  enviarIbpt(): void {
    // ✅ Bloquear se for básico
    if (!this.canAccessFiscalFeatures) {
      this.notification.error('Recurso disponível apenas nos planos Premium e Pro');
      return;
    }

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
        if (fileInput) {
          fileInput.value = '';
        }
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

  // ===== MÉTODOS GERAIS =====
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
      this.notification.error(
        `Por favor, preencha os campos obrigatórios: ${invalidFields.join(', ')}`
      );
    }
  }

  markAllAsTouched(): void {
    Object.keys(this.companyForm.controls).forEach(key => {
      this.companyForm.get(key)?.markAsTouched();
    });
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    const fieldLabels: { [key: string]: string } = {
      cnpj: 'CNPJ',
      corporateName: 'Razão Social',
      tradeName: 'Nome Fantasia',
      stateRegistration: 'Inscrição Estadual',
      taxRegime: 'Regime Tributário',
      street: 'Logradouro',
      number: 'Número',
      neighborhood: 'Bairro',
      city: 'Município',
      cityCode: 'Código do Município',
      state: 'UF',
      zipCode: 'CEP',
      phone: 'Telefone',
      email: 'E-mail',
      nfceSeries: 'Série NFC-e',
      nfceCurrentNumber: 'Número Atual NFC-e',
      nfceEnvironment: 'Ambiente NFC-e',
      nfceCsc: 'CSC',
      nfceCscId: 'ID do CSC',
      certificatePath: 'Certificado',
      certificatePassword: 'Senha do Certificado',
    };

    Object.keys(this.companyForm.controls).forEach(key => {
      const control = this.companyForm.get(key);
      if (control?.invalid && control?.errors?.['required']) {
        invalidFields.push(fieldLabels[key] || key);
      }
    });
    console.log(invalidFields)

    return invalidFields;
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}