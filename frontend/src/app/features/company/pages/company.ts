import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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

  companyForm: FormGroup;
  companyId: number = 1;
  isLoading: boolean = false;

  // ✅ Verificar plano
  canAccessFiscalFeatures = this.licenseService.getCurrentPlan() !== 'basic';

  // Campos para certificado
  selectedFileName: string = '';
  selectedFile: File | null = null;

  // Campos para IBPT
  selectedIbptFileName: string = '';
  selectedIbptFile: File | null = null;
  isUploadingIbpt: boolean = false;

  constructor() {
    this.companyForm = this.fb.group({
      cnpj: ['', Validators.required],
      razaoSocial: ['', Validators.required],
      nomeFantasia: ['', Validators.required],
      inscricaoEstadual: ['', Validators.required],
      regimeTributario: ['1', Validators.required],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      municipio: ['', Validators.required],
      codigoMunicipio: ['', Validators.required],
      uf: ['', Validators.required],
      cep: ['', Validators.required],
      telefone: ['', Validators.required],
      email: ['', [Validators.email]],
      nfceSerie: ['', Validators.required],
      nfceNumeroAtual: [0, Validators.required],
      nfceAmbiente: ['homologacao', Validators.required],
      nfceCsc: ['', Validators.required],
      nfceIdCsc: ['', Validators.required],
      certificadoPath: ['', Validators.required],
      certificadoSenha: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCompanyData();
  }

  loadCompanyData(): void {
    this.isLoading = true;
    this.companyService.getCompanyById(this.companyId).subscribe({
      next: (company) => {
        this.companyForm.patchValue(company);
        if (company.certificadoPath) {
          this.selectedFileName = this.getFileName(company.certificadoPath);
        }
        this.isLoading = false;
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
        certificadoPath: file.name,
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

    const certificadoSenha = this.companyForm.get('certificadoSenha')?.value;
    if (!certificadoSenha) {
      this.notification.error('Informe a senha do certificado.');
      return;
    }

    this.isLoading = true;
    this.companyService
      .uploadCompanyCertificate(this.companyId, this.selectedFile, certificadoSenha)
      .subscribe({
        next: () => {
          this.notification.success('Certificado enviado com sucesso!');
          this.isLoading = false;
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
      this.isLoading = true;
      this.companyService.updateCompany(this.companyId, this.companyForm.value).subscribe({
        next: () => {
          this.notification.success('Empresa atualizada com sucesso!');
          this.isLoading = false;
        },
        error: () => {
          this.notification.error('Erro ao atualizar empresa');
          this.isLoading = false;
        },
      });
    } else {
      this.notification.error('Por favor, preencha todos os campos obrigatórios');
    }
  }

  goToMenu(): void {
    this.router.navigate(['/dashboard']);
  }
}
