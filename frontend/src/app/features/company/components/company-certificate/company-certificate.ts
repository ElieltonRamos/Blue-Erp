import { ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-company-certificate',
  imports: [ReactiveFormsModule],
  templateUrl: './company-certificate.html',
})
export class CompanyCertificate implements OnInit {
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dirtyChange = output<boolean>();

  isLoading = false;
  certificateConfigured = false;

  selectedFile: File | null = null;
  password = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.password.valueChanges.subscribe(() => this.emitDirty());
    this.load();
  }

  get canSubmit(): boolean {
    return !!this.selectedFile && !!this.password.value && !this.isLoading;
  }

  private load(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe({
      next: (company) => {
        this.certificateConfigured = company.certificateConfigured;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao carregar dados do certificado');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private emitDirty(): void {
    this.dirtyChange.emit(!!this.selectedFile || !!this.password.value);
  }

  triggerFileInput(): void {
    (document.getElementById('certificateFile') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pfx') && !name.endsWith('.p12')) {
      this.notification.error('Selecione um arquivo .pfx ou .p12.');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.emitDirty();
  }

  clear(): void {
    this.selectedFile = null;
    this.password.reset('', { emitEvent: false });
    (document.getElementById('certificateFile') as HTMLInputElement).value = '';
    this.dirtyChange.emit(false);
  }

  get hasPending(): boolean {
    return !!this.selectedFile || !!this.password.value;
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.notification.error('Selecione um certificado antes de enviar.');
      return;
    }
    if (!this.password.value) {
      this.notification.error('Informe a senha do certificado.');
      return;
    }

    this.isLoading = true;
    this.companyService.uploadCompanyCertificate(this.selectedFile, this.password.value).subscribe({
      next: () => {
        this.notification.success('Certificado enviado com sucesso!');
        this.certificateConfigured = true;
        this.selectedFile = null;
        this.password.reset('', { emitEvent: false });
        (document.getElementById('certificateFile') as HTMLInputElement).value = '';
        this.dirtyChange.emit(false);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notification.error('Erro ao enviar certificado.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
