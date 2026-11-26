import { ChangeDetectorRef, Component, inject, output } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';

@Component({
  selector: 'app-company-ibpt',
  templateUrl: './company-ibpt.html',
})
export class CompanyIbpt {
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dirtyChange = output<boolean>();

  isUploading = false;
  selectedFile: File | null = null;

  triggerFileInput(): void {
    (document.getElementById('ibptFile') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.notification.error('Por favor, selecione um arquivo CSV válido.');
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.dirtyChange.emit(true);
  }

  clear(): void {
    this.selectedFile = null;
    (document.getElementById('ibptFile') as HTMLInputElement).value = '';
    this.dirtyChange.emit(false);
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.notification.error('Selecione um arquivo CSV antes de enviar.');
      return;
    }

    this.isUploading = true;
    this.companyService.importIbptFromCsv(this.selectedFile).subscribe({
      next: (response) => {
        this.notification.success(response.message || 'Tabela IBPT atualizada com sucesso!');
        this.clear();
        this.isUploading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Erro ao importar tabela IBPT.');
        this.isUploading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
