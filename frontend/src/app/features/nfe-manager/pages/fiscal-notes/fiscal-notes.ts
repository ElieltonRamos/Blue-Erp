import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FiscalService } from '../../services/fiscal.service';
import { NotificationService } from '../../../../shared/toastr/notification.service';
import { PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { NotaFiscal, SefazStatus } from '../../types/fiscal';

@Component({
  selector: 'app-fiscal-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginatorComponent],
  templateUrl: './fiscal-notes.html',
})
export class FiscalNotes implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private fiscalService = inject(FiscalService);
  private notification = inject(NotificationService);

  // Filtros — status inicial EMITIDA
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterStatus: string = 'EMITIDA';

  // Paginação
  notas: NotaFiscal[] = [];
  page: number = 1;
  limit: number = 20;
  totalPages: number = 0;
  totalItems: number = 0;

  sefazStatus: SefazStatus | null = null;
  sefazError: string | null = null;
  loading = false;
  checkingSefaz = false;

  // Modal cancelamento
  showCancelModal = false;
  cancelTarget: NotaFiscal | null = null;
  cancelJustification = new FormControl<string>('', []);
  canceling = false;

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'PENDENTE', label: 'Pendente' },
    { value: 'EMITIDA', label: 'Emitida' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'ERRO', label: 'Erro' },
  ];

  ngOnInit(): void {
    this.checkSefazStatus();
    this.loadNotas(this.page, this.limit);
  }

  checkSefazStatus(): void {
    this.checkingSefaz = true;
    this.sefazError = null;

    this.fiscalService.getSefazStatus().subscribe({
      next: (status) => {
        this.sefazStatus = status;
        this.checkingSefaz = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.sefazStatus = null;
        this.sefazError = e.error?.message ?? 'Erro ao verificar SEFAZ';
        this.checkingSefaz = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadNotas(page: number, limit: number): void {
    this.loading = true;

    this.fiscalService
      .getNotas({
        startDate: this.filterStartDate || undefined,
        endDate: this.filterEndDate || undefined,
        status: this.filterStatus || undefined,
        page,
        limit,
      })
      .subscribe({
        next: (res) => {
          this.notas = res.data;
          this.totalItems = res.total;
          this.page = res.page;
          this.limit = res.limit;
          this.totalPages = res.totalPages;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (e) => {
          this.loading = false;
          this.notification.error(
            `Erro ao carregar notas: ${e.error?.message ?? 'Erro desconhecido'}`,
          );
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadNotas(this.page, this.limit);
  }

  clearFilters(): void {
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterStatus = 'EMITIDA';
    this.page = 1;
    this.loadNotas(this.page, this.limit);
  }

  downloadPdf(nota: NotaFiscal): void {
    this.fiscalService.downloadPdf(nota.fiscalKey).subscribe({
      next: (blob) => this.downloadFile(blob, `nfce-${nota.nNF}.pdf`),
      error: (e) =>
        this.notification.error(`Erro ao baixar PDF: ${e.error?.message ?? 'Erro desconhecido'}`),
    });
  }

  reemitirPdf(nota: NotaFiscal): void {
    this.fiscalService.reemitirPdf(nota.id).subscribe({
      next: (blob) => this.downloadFile(blob, `nfce-reemissao-${nota.nNF}.pdf`),
      error: (e) =>
        this.notification.error(`Erro ao reemitir PDF: ${e.error?.message ?? 'Erro desconhecido'}`),
    });
  }

  downloadXml(nota: NotaFiscal): void {
    this.fiscalService.downloadXml(nota.id).subscribe({
      next: (blob) => this.downloadFile(blob, `nfce-${nota.nNF}.xml`),
      error: (e) =>
        this.notification.error(`Erro ao baixar XML: ${e.error?.message ?? 'Erro desconhecido'}`),
    });
  }

  queryNota(nota: NotaFiscal): void {
    this.fiscalService.queryNota(nota.fiscalKey).subscribe({
      next: (res) => this.notification.success(`Status SEFAZ: ${res?.status ?? 'Consultado'}`),
      error: (e) =>
        this.notification.error(
          `Erro ao consultar SEFAZ: ${e.error?.message ?? 'Erro desconhecido'}`,
        ),
    });
  }

  openCancelModal(nota: NotaFiscal): void {
    this.cancelTarget = nota;
    this.cancelJustification.reset('');
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.cancelTarget = null;
    this.cancelJustification.reset('');
  }

  confirmCancel(): void {
    const justification = this.cancelJustification.value ?? '';

    if (justification.length < 15) {
      this.notification.error('A justificativa deve ter no mínimo 15 caracteres (requisito SEFAZ)');
      return;
    }

    if (!this.cancelTarget) return;

    this.canceling = true;
    this.fiscalService.cancelNota(this.cancelTarget.fiscalKey, justification).subscribe({
      next: () => {
        this.notification.success('Nota cancelada com sucesso');
        this.canceling = false;
        this.closeCancelModal();
        this.loadNotas(this.page, this.limit);
      },
      error: (e) => {
        this.canceling = false;
        this.notification.error(
          `Erro ao cancelar nota: ${e.error?.message ?? 'Erro desconhecido'}`,
        );
      },
    });
  }

  canCancel(nota: NotaFiscal): boolean {
    return nota.fiscalStatus === 'EMITIDA';
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  get justificationLength(): number {
    return this.cancelJustification.value?.length ?? 0;
  }
}
